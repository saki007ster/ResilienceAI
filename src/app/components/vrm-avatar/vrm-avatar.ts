import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { HeadTts, TTSState } from '../../services/head-tts';
import * as THREE from 'three';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface VRMExpression {
  happy: number;
  sad: number;
  surprised: number;
  angry: number;
  relaxed: number;
  // Viseme expressions for lip-sync
  aa: number;
  ih: number;
  ou: number;
  ee: number;
  oh: number;
}

@Component({
  selector: 'app-vrm-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vrm-avatar.html',
  styleUrl: './vrm-avatar.scss'
})
export class VrmAvatar implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('avatarContainer', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @Input() size: number = 400;
  @Input() isVisible: boolean = true;
  @Input() avatarUrl: string = '/assets/avatars/default.vrm';

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private vrm: VRM | null = null;
  private animationId?: number;
  private ttsSubscription?: Subscription;

  // Avatar state
  currentViseme = 'sil';
  isSpeaking = false;
  isLoading = true;
  loadError = false;

  // Animation properties
  private eyeBlinkTimer = 0;
  private headBobTimer = 0;
  private breathingTimer = 0;
  private eyesOpen = true;
  private blinkProgress = 0;

  // Current expression values
  private currentExpression: VRMExpression = {
    happy: 0,
    sad: 0,
    surprised: 0,
    angry: 0,
    relaxed: 0.3, // Default slight relaxed expression
    aa: 0,
    ih: 0,
    ou: 0,
    ee: 0,
    oh: 0
  };

  constructor(private headTts: HeadTts) {}

  ngOnInit() {
    this.subscribeToTTS();
  }

  ngOnDestroy() {
    this.cleanup();
    this.ttsSubscription?.unsubscribe();
  }

  ngAfterViewInit() {
    // Wait for the view to be fully rendered
    setTimeout(() => {
      this.setupThreeJS();
      this.startAnimation();
      // Load VRM after Three.js is set up
      this.loadVRMAvatar();
    }, 100);
  }

  private setupThreeJS(): void {
    const container = this.containerRef.nativeElement;
    
    console.log('Setting up Three.js:', {
      containerWidth: container.clientWidth,
      containerHeight: container.clientHeight,
      size: this.size
    });
    
    // Ensure container has proper size
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      container.style.width = `${this.size}px`;
      container.style.height = `${this.size}px`;
      console.log('Container size was 0, setting to:', this.size);
    }
    
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf8fafc); // Light gray-blue background

    // Camera setup for portrait view
    this.camera = new THREE.PerspectiveCamera(
      25, // Narrower field of view for portrait effect
      container.clientWidth / container.clientHeight, 
      0.1, 
      20
    );
    this.camera.position.set(0, 1.4, 1.2); // Positioned for head/shoulders view
    this.camera.lookAt(0, 1.4, 0); // Look at head level

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      precision: 'highp'
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    container.appendChild(this.renderer.domElement);

    // Lighting setup
    this.setupLighting();

    // Handle resize
    window.addEventListener('resize', () => this.onWindowResize());
    
    console.log('Three.js setup complete');
  }

  private setupLighting(): void {
    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Ambient light for softer shadows
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Rim light for better avatar visibility
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(-1, 1, -1);
    this.scene.add(rimLight);
  }

  public async loadVRMAvatar(): Promise<void> {
    try {
      this.isLoading = true;
      this.loadError = false;
      
      console.log('Loading VRM avatar from:', this.avatarUrl);

      const loader = new GLTFLoader();
      loader.register((parser: any) => new VRMLoaderPlugin(parser));

      const gltf = await loader.loadAsync(this.avatarUrl);
      this.vrm = gltf.userData['vrm'] as VRM;

      if (this.vrm) {
        // Remove existing VRM from scene
        const existingVRM = this.scene.children.find((child: any) => child.userData?.vrm);
        if (existingVRM) {
          this.scene.remove(existingVRM);
        }

        // Add new VRM to scene
        this.scene.add(this.vrm.scene);

        // Position and scale the avatar for portrait view
        this.vrm.scene.position.set(0, -0.5, 0); // Position for head/shoulder view
        this.vrm.scene.rotation.set(0, 0, 0);
        
        // Scale appropriately for the viewport
        const box = new THREE.Box3().setFromObject(this.vrm.scene);
        const size = box.getSize(new THREE.Vector3());
        // Scale to fit nicely in portrait view
        const scale = 2.2 / size.y; // Increased scale for closer view
        this.vrm.scene.scale.setScalar(scale);

        // Apply T-pose for proper setup
        VRMUtils.rotateVRM0(this.vrm);

        // Position camera for portrait/headshot view
        this.camera.position.set(0, 1.4, 1.2); // Much closer to focus on head/shoulders
        this.camera.lookAt(0, 1.4, 0); // Look at head level
        
        // Adjust camera field of view for tighter framing
        this.camera.fov = 25; // Narrower field of view for portrait effect
        this.camera.updateProjectionMatrix();

        this.isLoading = false;
        console.log('VRM Avatar loaded successfully (portrait view):', this.vrm);
        console.log('Avatar size:', size);
      } else {
        throw new Error('VRM data not found in loaded GLTF');
      }
    } catch (error) {
      console.error('Failed to load VRM avatar:', error);
      this.loadError = true;
      this.isLoading = false;
      
      // Load fallback avatar or show error
      this.loadFallbackAvatar();
    }
  }

  private loadFallbackAvatar(): void {
    // Create a more attractive fallback avatar with geometric shapes
    const fallbackGroup = new THREE.Group();
    
    // Head - positioned for portrait view
    const headGeometry = new THREE.SphereGeometry(0.25, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffc0cb, // Soft pink
      roughness: 0.6,
      metalness: 0.1
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.5, 0); // Positioned for portrait view
    head.castShadow = true;
    head.receiveShadow = true;
    fallbackGroup.add(head);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.03, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.07, 1.55, 0.18);
    fallbackGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.07, 1.55, 0.18);
    fallbackGroup.add(rightEye);
    
    // Nose
    const noseGeometry = new THREE.ConeGeometry(0.02, 0.06, 8);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xffb6c1 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 1.48, 0.22);
    nose.rotation.x = Math.PI;
    fallbackGroup.add(nose);
    
    // Neck and upper shoulders - visible in portrait view
    const neckGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.4, 16);
    const neckMaterial = new THREE.MeshStandardMaterial({ color: 0xffc0cb });
    const neck = new THREE.Mesh(neckGeometry, neckMaterial);
    neck.position.set(0, 1.1, 0);
    neck.castShadow = true;
    neck.receiveShadow = true;
    fallbackGroup.add(neck);
    
    // Simple shirt/collar area
    const collarGeometry = new THREE.CylinderGeometry(0.18, 0.22, 0.3, 16);
    const collarMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x87ceeb, // Sky blue
      roughness: 0.7,
      metalness: 0.2
    });
    const collar = new THREE.Mesh(collarGeometry, collarMaterial);
    collar.position.set(0, 0.85, 0);
    collar.castShadow = true;
    collar.receiveShadow = true;
    fallbackGroup.add(collar);
    
    // Scale the entire fallback avatar for portrait view
    fallbackGroup.scale.setScalar(1.2);
    
    // Add some simple animation to the fallback avatar
    let animationTime = 0;
    const animateFallback = () => {
      animationTime += 0.01;
      // Subtle head movements
      head.rotation.y = Math.sin(animationTime) * 0.05;
      head.rotation.x = Math.sin(animationTime * 2) * 0.02;
      
      // Gentle breathing motion
      fallbackGroup.position.y = Math.sin(animationTime * 3) * 0.01;
      
      requestAnimationFrame(animateFallback);
    };
    animateFallback();
    
    this.scene.add(fallbackGroup);
    this.isLoading = false;
    console.log('Enhanced fallback avatar loaded (portrait view)');
  }

  private subscribeToTTS(): void {
    this.ttsSubscription = this.headTts.state$.subscribe((state: TTSState) => {
      this.currentViseme = state.currentViseme;
      this.isSpeaking = state.isSpeaking;
      
      // Update facial expressions based on speaking state
      if (this.isSpeaking) {
        this.setExpression('happy', 0.2);
        this.updateVisemeExpression(state.currentViseme);
      } else {
        this.setExpression('relaxed', 0.3);
        this.resetVisemeExpressions();
      }
      
      console.log('VRM Avatar: TTS state update:', state);
    });
  }

  private updateVisemeExpression(viseme: string): void {
    // Reset all viseme expressions
    this.resetVisemeExpressions();

    // Map visemes to VRM expressions
    switch (viseme) {
      case 'aa':
        this.currentExpression.aa = 0.8;
        break;
      case 'E':
        this.currentExpression.ee = 0.7;
        break;
      case 'I':
        this.currentExpression.ih = 0.6;
        break;
      case 'O':
        this.currentExpression.oh = 0.8;
        break;
      case 'U':
        this.currentExpression.ou = 0.7;
        break;
      case 'sil':
      default:
        // Neutral mouth position
        break;
    }

    this.applyExpressionsToVRM();
  }

  private resetVisemeExpressions(): void {
    this.currentExpression.aa = 0;
    this.currentExpression.ih = 0;
    this.currentExpression.ou = 0;
    this.currentExpression.ee = 0;
    this.currentExpression.oh = 0;
  }

  private setExpression(emotion: keyof VRMExpression, intensity: number): void {
    // Reset all emotions
    this.currentExpression.happy = 0;
    this.currentExpression.sad = 0;
    this.currentExpression.surprised = 0;
    this.currentExpression.angry = 0;
    this.currentExpression.relaxed = 0;

    // Set the specific emotion
    this.currentExpression[emotion] = Math.max(0, Math.min(1, intensity));
    this.applyExpressionsToVRM();
  }

  private applyExpressionsToVRM(): void {
    if (!this.vrm?.expressionManager) return;

    try {
      // Apply facial expressions to VRM
      Object.entries(this.currentExpression).forEach(([expression, value]) => {
        if (this.vrm?.expressionManager) {
          this.vrm.expressionManager.setValue(expression, value);
        }
      });

      this.vrm.expressionManager.update();
    } catch (error) {
      console.warn('Failed to apply expressions to VRM:', error);
    }
  }

  private startAnimation(): void {
    const animate = () => {
      this.updateAnimation();
      this.render();
      this.animationId = requestAnimationFrame(animate);
    };
    
    this.animationId = requestAnimationFrame(animate);
  }

  private updateAnimation(): void {
    const deltaTime = 16; // ~60fps

    // Eye blink animation
    this.eyeBlinkTimer += deltaTime;
    if (this.eyeBlinkTimer > 3000 + Math.random() * 2000) {
      this.triggerBlink();
      this.eyeBlinkTimer = 0;
    }

    // Breathing animation
    this.breathingTimer += deltaTime;
    const breathingIntensity = Math.sin(this.breathingTimer * 0.002) * 0.02;

    // Head bobbing during speech
    if (this.isSpeaking && this.vrm) {
      this.headBobTimer += deltaTime;
      const bobIntensity = Math.sin(this.headBobTimer * 0.005) * 0.05;
      
      if (this.vrm.humanoid?.getNormalizedBoneNode('head')) {
        const headBone = this.vrm.humanoid.getNormalizedBoneNode('head')!;
        headBone.rotation.y = bobIntensity;
        headBone.rotation.x = breathingIntensity;
      }
    }

    // Update VRM
    if (this.vrm) {
      this.vrm.update(deltaTime / 1000);
    }
  }

  private triggerBlink(): void {
    if (!this.vrm?.expressionManager) return;

    // Quick blink animation
    this.vrm.expressionManager.setValue('blink', 1);
    this.vrm.expressionManager.update();

    setTimeout(() => {
      if (this.vrm?.expressionManager) {
        this.vrm.expressionManager.setValue('blink', 0);
        this.vrm.expressionManager.update();
      }
    }, 150);
  }

  private render(): void {
    if (!this.isVisible) return;
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize(): void {
    const container = this.containerRef.nativeElement;
    
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  private cleanup(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.renderer) {
      this.renderer.dispose();
    }

    if (this.vrm) {
      VRMUtils.deepDispose(this.vrm.scene);
    }

    window.removeEventListener('resize', () => this.onWindowResize());
  }

  // Public methods for external control
  public speak(text: string): void {
    this.headTts.speak(text);
  }

  public stopSpeaking(): void {
    this.headTts.stop();
  }

  public pauseSpeaking(): void {
    this.headTts.pause();
  }

  public triggerEmotion(emotion: 'happy' | 'sad' | 'surprised' | 'angry' | 'neutral'): void {
    switch (emotion) {
      case 'happy':
        this.setExpression('happy', 0.8);
        break;
      case 'sad':
        this.setExpression('sad', 0.6);
        break;
      case 'surprised':
        this.setExpression('surprised', 0.9);
        break;
      case 'angry':
        this.setExpression('angry', 0.7);
        break;
      case 'neutral':
        this.setExpression('relaxed', 0.3);
        break;
    }

    // Auto-return to neutral after 3 seconds
    setTimeout(() => {
      if (!this.isSpeaking) {
        this.setExpression('relaxed', 0.3);
      }
    }, 3000);
  }

  public changeAvatar(newAvatarUrl: string): void {
    this.avatarUrl = newAvatarUrl;
    this.loadVRMAvatar();
  }

  public getCurrentState(): TTSState {
    return this.headTts.currentState;
  }
} 