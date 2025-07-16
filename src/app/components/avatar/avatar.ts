import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { HeadTts, TTSState } from '../../services/head-tts';

interface FacialExpression {
  eyebrowHeight: number;
  eyeSize: number;
  mouthCurve: number;
  cheekRaise: number;
}

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.html',
  styleUrl: './avatar.scss'
})
export class Avatar implements OnInit, OnDestroy {
  @ViewChild('avatarCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() size: number = 280;
  @Input() isVisible: boolean = true;

  private ctx!: CanvasRenderingContext2D;
  private ttsSubscription?: Subscription;
  private animationId?: number;

  // Avatar state
  currentViseme = 'sil';
  isSpeaking = false;
  isAnimating = false;

  // Enhanced animation properties
  private eyeBlinkTimer = 0;
  private headBobTimer = 0;
  private expressionTimer = 0;
  private breathingTimer = 0;
  private eyesOpen = true;
  private blinkProgress = 0;
  private headOffset = { x: 0, y: 0 };
  private breathingOffset = 0;
  private currentExpression: FacialExpression = {
    eyebrowHeight: 0,
    eyeSize: 1,
    mouthCurve: 0.1,
    cheekRaise: 0
  };

  // Avatar appearance settings
  private skinTone = '#fdbcb4';
  private hairColor = '#8B4513';
  private eyeColor = '#4A90E2';
  private lipColor = '#CD5C5C';

  constructor(private headTts: HeadTts) {}

  ngOnInit() {
    this.setupCanvas();
    this.subscribeToTTS();
    this.startAnimation();
  }

  ngOnDestroy() {
    this.ttsSubscription?.unsubscribe();
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private setupCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = this.size;
    canvas.height = this.size;
    
    this.ctx = canvas.getContext('2d')!;
    if (this.ctx) {
      // Set high DPI support
      const ratio = window.devicePixelRatio || 1;
      canvas.width = this.size * ratio;
      canvas.height = this.size * ratio;
      canvas.style.width = this.size + 'px';
      canvas.style.height = this.size + 'px';
      this.ctx.scale(ratio, ratio);
      
      // Set smooth rendering
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      
      console.log('Avatar: Enhanced canvas setup complete');
    }
  }

  private subscribeToTTS(): void {
    this.ttsSubscription = this.headTts.state$.subscribe((state: TTSState) => {
      this.currentViseme = state.currentViseme;
      this.isSpeaking = state.isSpeaking;
      
      // Update expression based on speaking state
      if (this.isSpeaking) {
        this.currentExpression = {
          eyebrowHeight: 0.1,
          eyeSize: 1.1,
          mouthCurve: 0,
          cheekRaise: 0.05
        };
      } else {
        this.currentExpression = {
          eyebrowHeight: 0,
          eyeSize: 1,
          mouthCurve: 0.1,
          cheekRaise: 0
        };
      }
      
      console.log('Avatar: TTS state update:', state);
    });
  }

  private startAnimation(): void {
    const animate = (timestamp: number) => {
      this.updateAnimation(timestamp);
      this.drawAvatar();
      this.animationId = requestAnimationFrame(animate);
    };
    
    this.animationId = requestAnimationFrame(animate);
  }

  private updateAnimation(timestamp: number): void {
    const deltaTime = 16; // ~60fps

    // Enhanced eye blink animation
    this.eyeBlinkTimer += deltaTime;
    if (this.eyeBlinkTimer > 2500 + Math.random() * 3000) {
      this.startBlink();
      this.eyeBlinkTimer = 0;
    }
    
    if (!this.eyesOpen) {
      this.blinkProgress += 0.15;
      if (this.blinkProgress >= 1) {
        this.eyesOpen = true;
        this.blinkProgress = 0;
      }
    }

    // Breathing animation (subtle chest/shoulder movement)
    this.breathingTimer += deltaTime;
    this.breathingOffset = Math.sin(this.breathingTimer * 0.003) * 1.5;

    // Head movement (more natural)
    if (this.isSpeaking) {
      this.headBobTimer += deltaTime;
      this.headOffset.x = Math.sin(this.headBobTimer * 0.004) * 1.5;
      this.headOffset.y = Math.sin(this.headBobTimer * 0.006) * 1 + this.breathingOffset;
    } else {
      // Subtle idle movement
      this.headOffset.x = Math.sin(timestamp * 0.0008) * 0.5;
      this.headOffset.y = this.breathingOffset * 0.5;
    }

    // Micro-expressions
    this.expressionTimer += deltaTime;
    if (this.expressionTimer > 5000 + Math.random() * 10000) {
      this.addMicroExpression();
      this.expressionTimer = 0;
    }
  }

  private startBlink(): void {
    this.eyesOpen = false;
    this.blinkProgress = 0;
  }

  private addMicroExpression(): void {
    if (!this.isSpeaking) {
      const expressions = [
        { eyebrowHeight: 0.05, eyeSize: 1.05, mouthCurve: 0.15, cheekRaise: 0.02 }, // Slight smile
        { eyebrowHeight: -0.02, eyeSize: 0.98, mouthCurve: 0.05, cheekRaise: 0 },   // Thoughtful
        { eyebrowHeight: 0.03, eyeSize: 1.02, mouthCurve: 0.08, cheekRaise: 0.01 }, // Curious
      ];
      
      const newExpression = expressions[Math.floor(Math.random() * expressions.length)];
      this.currentExpression = newExpression;
      
      // Reset to neutral after a moment
      setTimeout(() => {
        this.currentExpression = {
          eyebrowHeight: 0,
          eyeSize: 1,
          mouthCurve: 0.1,
          cheekRaise: 0
        };
      }, 2000);
    }
  }

  private drawAvatar(): void {
    if (!this.ctx) return;

    // Clear canvas with gradient background
    this.ctx.clearRect(0, 0, this.size, this.size);

    if (!this.isVisible) return;

    const centerX = this.size / 2 + this.headOffset.x;
    const centerY = this.size / 2 + this.headOffset.y;

    // Draw background glow
    this.drawBackgroundGlow(centerX, centerY);
    
    // Draw neck
    this.drawNeck(centerX, centerY);
    
    // Draw face shadow
    this.drawFaceShadow(centerX, centerY);
    
    // Draw head with realistic shading
    this.drawRealisticHead(centerX, centerY);
    
    // Draw hair
    this.drawHair(centerX, centerY);
    
    // Draw eyebrows
    this.drawEyebrows(centerX, centerY);
    
    // Draw eyes with detailed features
    this.drawRealisticEyes(centerX, centerY);
    
    // Draw nose
    this.drawNose(centerX, centerY);
    
    // Draw mouth with enhanced lip-sync
    this.drawRealisticMouth(centerX, centerY);
    
    // Draw cheeks and facial highlights
    this.drawFacialHighlights(centerX, centerY);

    // Draw speaking indicators
    if (this.isSpeaking) {
      this.drawEnhancedSpeakingIndicator(centerX, centerY);
    }
  }

  private drawBackgroundGlow(x: number, y: number): void {
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, this.size * 0.6);
    gradient.addColorStop(0, 'rgba(74, 144, 226, 0.1)');
    gradient.addColorStop(1, 'rgba(74, 144, 226, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.size, this.size);
  }

  private drawNeck(x: number, y: number): void {
    const neckWidth = this.size * 0.25;
    const neckHeight = this.size * 0.15;
    const neckY = y + this.size * 0.35;
    
    // Neck gradient
    const gradient = this.ctx.createLinearGradient(x - neckWidth/2, neckY, x + neckWidth/2, neckY);
    gradient.addColorStop(0, this.adjustBrightness(this.skinTone, -15));
    gradient.addColorStop(0.5, this.skinTone);
    gradient.addColorStop(1, this.adjustBrightness(this.skinTone, -15));
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - neckWidth/2, neckY, neckWidth, neckHeight);
  }

  private drawFaceShadow(x: number, y: number): void {
    const headRadius = this.size * 0.32;
    
    this.ctx.beginPath();
    this.ctx.ellipse(x + 3, y + 3, headRadius * 1.05, headRadius * 1.15, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    this.ctx.fill();
  }

  private drawRealisticHead(x: number, y: number): void {
    const headWidth = this.size * 0.32;
    const headHeight = this.size * 0.36;
    
    // Face gradient for 3D effect
    const faceGradient = this.ctx.createRadialGradient(
      x - headWidth * 0.2, y - headHeight * 0.1, 0,
      x, y, headWidth * 1.2
    );
    faceGradient.addColorStop(0, this.adjustBrightness(this.skinTone, 8));
    faceGradient.addColorStop(0.7, this.skinTone);
    faceGradient.addColorStop(1, this.adjustBrightness(this.skinTone, -12));

    // Draw face shape (slightly oval)
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, headWidth, headHeight, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = faceGradient;
    this.ctx.fill();
    
    // Face outline
    this.ctx.strokeStyle = this.adjustBrightness(this.skinTone, -20);
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
  }

  private drawHair(x: number, y: number): void {
    const headWidth = this.size * 0.32;
    const headHeight = this.size * 0.36;
    
    // Hair base
    this.ctx.beginPath();
    this.ctx.ellipse(x, y - headHeight * 0.7, headWidth * 1.1, headHeight * 0.8, 0, 0, Math.PI, true);
    
    const hairGradient = this.ctx.createLinearGradient(x, y - headHeight, x, y - headHeight * 0.3);
    hairGradient.addColorStop(0, this.adjustBrightness(this.hairColor, 15));
    hairGradient.addColorStop(1, this.adjustBrightness(this.hairColor, -10));
    
    this.ctx.fillStyle = hairGradient;
    this.ctx.fill();
    
    // Hair strands for texture
    this.ctx.strokeStyle = this.adjustBrightness(this.hairColor, -20);
    this.ctx.lineWidth = 1;
    
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 8) * i + Math.PI;
      const startRadius = headWidth * 0.9;
      const endRadius = headWidth * 1.05;
      
      const startX = x + Math.cos(angle) * startRadius;
      const startY = y + Math.sin(angle) * headHeight * 0.6 - headHeight * 0.2;
      const endX = x + Math.cos(angle) * endRadius;
      const endY = y + Math.sin(angle) * headHeight * 0.7 - headHeight * 0.2;
      
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
    }
  }

  private drawEyebrows(x: number, y: number): void {
    const eyebrowY = y - this.size * 0.18 + this.currentExpression.eyebrowHeight * this.size * 0.02;
    const eyebrowSpacing = this.size * 0.15;
    const eyebrowLength = this.size * 0.08;
    const eyebrowThickness = 3;
    
    this.ctx.strokeStyle = this.adjustBrightness(this.hairColor, -30);
    this.ctx.lineWidth = eyebrowThickness;
    this.ctx.lineCap = 'round';
    
    // Left eyebrow
    this.ctx.beginPath();
    this.ctx.moveTo(x - eyebrowSpacing - eyebrowLength/2, eyebrowY + 2);
    this.ctx.quadraticCurveTo(x - eyebrowSpacing, eyebrowY - 1, x - eyebrowSpacing + eyebrowLength/2, eyebrowY + 1);
    this.ctx.stroke();
    
    // Right eyebrow
    this.ctx.beginPath();
    this.ctx.moveTo(x + eyebrowSpacing - eyebrowLength/2, eyebrowY + 1);
    this.ctx.quadraticCurveTo(x + eyebrowSpacing, eyebrowY - 1, x + eyebrowSpacing + eyebrowLength/2, eyebrowY + 2);
    this.ctx.stroke();
  }

  private drawRealisticEyes(x: number, y: number): void {
    const eyeY = y - this.size * 0.08;
    const eyeSpacing = this.size * 0.15;
    const eyeWidth = this.size * 0.06 * this.currentExpression.eyeSize;
    const eyeHeight = this.eyesOpen ? 
      (this.size * 0.04 * this.currentExpression.eyeSize * (1 - this.blinkProgress)) : 
      this.size * 0.002;
    
    // Draw eyes
    ['left', 'right'].forEach((side, index) => {
      const eyeX = side === 'left' ? x - eyeSpacing : x + eyeSpacing;
      
      if (this.eyesOpen && this.blinkProgress < 0.8) {
        // Eye white
        this.ctx.beginPath();
        this.ctx.ellipse(eyeX, eyeY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Iris
        const irisRadius = eyeHeight * 0.7;
        this.ctx.beginPath();
        this.ctx.arc(eyeX, eyeY, irisRadius, 0, Math.PI * 2);
        
        const irisGradient = this.ctx.createRadialGradient(
          eyeX - irisRadius * 0.3, eyeY - irisRadius * 0.3, 0,
          eyeX, eyeY, irisRadius
        );
        irisGradient.addColorStop(0, this.adjustBrightness(this.eyeColor, 20));
        irisGradient.addColorStop(0.7, this.eyeColor);
        irisGradient.addColorStop(1, this.adjustBrightness(this.eyeColor, -30));
        
        this.ctx.fillStyle = irisGradient;
        this.ctx.fill();
        
        // Pupil
        this.ctx.beginPath();
        this.ctx.arc(eyeX, eyeY, irisRadius * 0.4, 0, Math.PI * 2);
        this.ctx.fillStyle = '#000000';
        this.ctx.fill();
        
        // Eye highlight
        this.ctx.beginPath();
        this.ctx.arc(eyeX - irisRadius * 0.25, eyeY - irisRadius * 0.25, irisRadius * 0.2, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
        
        // Smaller highlight
        this.ctx.beginPath();
        this.ctx.arc(eyeX + irisRadius * 0.15, eyeY - irisRadius * 0.1, irisRadius * 0.08, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fill();
        
        // Eyelashes
        this.drawEyelashes(eyeX, eyeY, eyeWidth, eyeHeight);
        
      } else {
        // Closed eye or blinking
        this.ctx.beginPath();
        this.ctx.ellipse(eyeX, eyeY, eyeWidth, Math.max(eyeHeight, 1), 0, 0, Math.PI * 2);
        this.ctx.fillStyle = this.adjustBrightness(this.skinTone, -5);
        this.ctx.fill();
        this.ctx.strokeStyle = this.adjustBrightness(this.skinTone, -15);
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }
    });
  }

  private drawEyelashes(eyeX: number, eyeY: number, eyeWidth: number, eyeHeight: number): void {
    this.ctx.strokeStyle = this.adjustBrightness(this.hairColor, -40);
    this.ctx.lineWidth = 0.8;
    
    const lashCount = 6;
    for (let i = 0; i < lashCount; i++) {
      const angle = (Math.PI / (lashCount - 1)) * i - Math.PI / 2;
      const startX = eyeX + Math.cos(angle) * eyeWidth * 0.9;
      const startY = eyeY - Math.abs(Math.sin(angle)) * eyeHeight * 0.9;
      const endX = eyeX + Math.cos(angle) * eyeWidth * 1.2;
      const endY = eyeY - Math.abs(Math.sin(angle)) * eyeHeight * 1.3;
      
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
    }
  }

  private drawNose(x: number, y: number): void {
    const noseY = y + this.size * 0.02;
    const noseWidth = this.size * 0.025;
    const noseHeight = this.size * 0.08;
    
    // Nose bridge shadow
    const bridgeGradient = this.ctx.createLinearGradient(x - noseWidth, noseY, x + noseWidth, noseY);
    bridgeGradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
    bridgeGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.05)');
    bridgeGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    
    this.ctx.fillStyle = bridgeGradient;
    this.ctx.fillRect(x - noseWidth/2, noseY - noseHeight/2, noseWidth, noseHeight);
    
    // Nostrils
    const nostrilY = noseY + noseHeight * 0.3;
    const nostrilSpacing = noseWidth * 0.6;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.ellipse(x - nostrilSpacing, nostrilY, noseWidth * 0.2, noseWidth * 0.1, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.ellipse(x + nostrilSpacing, nostrilY, noseWidth * 0.2, noseWidth * 0.1, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Nose highlight
    this.ctx.fillStyle = this.adjustBrightness(this.skinTone, 10);
    this.ctx.beginPath();
    this.ctx.ellipse(x - noseWidth * 0.2, noseY - noseHeight * 0.2, noseWidth * 0.3, noseHeight * 0.4, 0, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawRealisticMouth(x: number, y: number): void {
    const mouthY = y + this.size * 0.16;
    const mouthShape = this.getEnhancedMouthShape(this.currentViseme);
    
    // Lip base
    this.ctx.fillStyle = this.adjustBrightness(this.lipColor, -10);
    this.ctx.strokeStyle = this.adjustBrightness(this.lipColor, -25);
    this.ctx.lineWidth = 1;
    
    switch (mouthShape.type) {
      case 'oval':
        this.drawOvalMouth(x, mouthY, mouthShape);
        break;
      case 'line':
        this.drawLineMouth(x, mouthY, mouthShape);
        break;
      case 'smile':
        this.drawSmileMouth(x, mouthY, mouthShape);
        break;
      case 'round':
        this.drawRoundMouth(x, mouthY, mouthShape);
        break;
    }
  }

  private drawOvalMouth(x: number, y: number, shape: any): void {
    // Mouth opening
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, shape.width, shape.height, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = '#2d1810'; // Dark mouth interior
    this.ctx.fill();
    
    // Upper lip
    this.ctx.beginPath();
    this.ctx.ellipse(x, y - shape.height * 0.3, shape.width, shape.height * 0.4, 0, Math.PI, 2 * Math.PI);
    this.ctx.fillStyle = this.lipColor;
    this.ctx.fill();
    
    // Lower lip
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + shape.height * 0.3, shape.width, shape.height * 0.5, 0, 0, Math.PI);
    this.ctx.fillStyle = this.adjustBrightness(this.lipColor, -8);
    this.ctx.fill();
    
    // Lip highlight
    this.ctx.beginPath();
    this.ctx.ellipse(x, y + shape.height * 0.1, shape.width * 0.6, shape.height * 0.2, 0, 0, Math.PI);
    this.ctx.fillStyle = this.adjustBrightness(this.lipColor, 15);
    this.ctx.fill();
  }

  private drawLineMouth(x: number, y: number, shape: any): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x - shape.width, y);
    this.ctx.lineTo(x + shape.width, y);
    this.ctx.strokeStyle = this.adjustBrightness(this.lipColor, -20);
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private drawSmileMouth(x: number, y: number, shape: any): void {
    const curve = this.currentExpression.mouthCurve;
    
    this.ctx.beginPath();
    this.ctx.moveTo(x - shape.width, y + curve * shape.height);
    this.ctx.quadraticCurveTo(x, y - curve * shape.height * 2, x + shape.width, y + curve * shape.height);
    this.ctx.strokeStyle = this.adjustBrightness(this.lipColor, -15);
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    
    // Lip volume
    this.ctx.beginPath();
    this.ctx.moveTo(x - shape.width * 0.8, y + curve * shape.height * 0.8);
    this.ctx.quadraticCurveTo(x, y - curve * shape.height * 1.5, x + shape.width * 0.8, y + curve * shape.height * 0.8);
    this.ctx.strokeStyle = this.lipColor;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private drawRoundMouth(x: number, y: number, shape: any): void {
    // Dark interior
    this.ctx.beginPath();
    this.ctx.arc(x, y, shape.width, 0, Math.PI * 2);
    this.ctx.fillStyle = '#2d1810';
    this.ctx.fill();
    
    // Lip ring
    this.ctx.beginPath();
    this.ctx.arc(x, y, shape.width, 0, Math.PI * 2);
    this.ctx.strokeStyle = this.lipColor;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    
    // Inner highlight
    this.ctx.beginPath();
    this.ctx.arc(x, y, shape.width * 0.7, 0, Math.PI * 2);
    this.ctx.strokeStyle = this.adjustBrightness(this.lipColor, 10);
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  private getEnhancedMouthShape(viseme: string): { type: string; width: number; height: number } {
    const baseSize = this.size * 0.05;
    
    switch (viseme) {
      case 'aa': // Open vowels
        return { type: 'oval', width: baseSize * 1.4, height: baseSize * 2 };
      case 'E':
        return { type: 'oval', width: baseSize * 1.1, height: baseSize * 1.2 };
      case 'I':
        return { type: 'oval', width: baseSize * 0.9, height: baseSize * 0.8 };
      case 'O':
        return { type: 'round', width: baseSize * 0.8, height: baseSize * 1.5 };
      case 'U':
        return { type: 'round', width: baseSize * 0.6, height: baseSize * 1.2 };
      case 'PP': // Closed consonants
        return { type: 'line', width: baseSize * 0.6, height: 0 };
      case 'SS': // Sibilants
        return { type: 'oval', width: baseSize * 0.5, height: baseSize * 0.4 };
      case 'TH': // Dental
        return { type: 'oval', width: baseSize * 0.7, height: baseSize * 0.5 };
      case 'CH': // Affricates
        return { type: 'round', width: baseSize * 0.6, height: baseSize * 0.8 };
      case 'FF': // Fricatives
        return { type: 'oval', width: baseSize * 0.6, height: baseSize * 0.4 };
      case 'kk': // Velars
        return { type: 'oval', width: baseSize * 0.9, height: baseSize * 0.7 };
      case 'nn': // Nasals
        return { type: 'line', width: baseSize * 0.7, height: 0 };
      case 'RR': // Liquids
        return { type: 'oval', width: baseSize * 0.8, height: baseSize * 0.6 };
      case 'DD': // Stops
        return { type: 'oval', width: baseSize * 0.7, height: baseSize * 0.6 };
      case 'sil': // Silence
      default:
        return { type: 'smile', width: baseSize * 1, height: baseSize * 0.3 };
    }
  }

  private drawFacialHighlights(x: number, y: number): void {
    // Cheek highlights
    if (this.currentExpression.cheekRaise > 0) {
      const cheekY = y + this.size * 0.05;
      const cheekSpacing = this.size * 0.2;
      const cheekSize = this.size * 0.04 * this.currentExpression.cheekRaise;
      
      this.ctx.fillStyle = this.adjustBrightness(this.skinTone, 12);
      
      // Left cheek
      this.ctx.beginPath();
      this.ctx.arc(x - cheekSpacing, cheekY, cheekSize, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Right cheek
      this.ctx.beginPath();
      this.ctx.arc(x + cheekSpacing, cheekY, cheekSize, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Forehead highlight
    this.ctx.fillStyle = this.adjustBrightness(this.skinTone, 8);
    this.ctx.beginPath();
    this.ctx.ellipse(x, y - this.size * 0.25, this.size * 0.15, this.size * 0.08, 0, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawEnhancedSpeakingIndicator(x: number, y: number): void {
    const time = Date.now() * 0.008;
    const baseRadius = this.size * 0.4;
    
    // Multiple animated rings with different speeds
    for (let i = 0; i < 4; i++) {
      const ringRadius = baseRadius + (i * 8) + (Math.sin(time + i * 0.5) * 6);
      const opacity = 0.4 - (i * 0.08);
      const hue = 120 + (Math.sin(time * 0.5) * 30); // Green to blue-green
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${opacity})`;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
    
    // Pulsing glow
    const glowRadius = baseRadius + Math.sin(time * 2) * 10;
    const glowGradient = this.ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
    glowGradient.addColorStop(0, 'rgba(76, 175, 80, 0.1)');
    glowGradient.addColorStop(1, 'rgba(76, 175, 80, 0)');
    
    this.ctx.fillStyle = glowGradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private adjustBrightness(hexColor: string, percent: number): string {
    const num = parseInt(hexColor.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  // Enhanced public methods
  speak(text: string): Promise<void> {
    return this.headTts.speak(text);
  }

  stopSpeaking(): void {
    this.headTts.stop();
  }

  pauseSpeaking(): void {
    this.headTts.pause();
  }

  resumeSpeaking(): void {
    this.headTts.resume();
  }

  setVisibility(visible: boolean): void {
    this.isVisible = visible;
  }

  getCurrentState(): TTSState {
    return this.headTts.currentState;
  }

  // New customization methods
  setSkinTone(color: string): void {
    this.skinTone = color;
  }

  setHairColor(color: string): void {
    this.hairColor = color;
  }

  setEyeColor(color: string): void {
    this.eyeColor = color;
  }

  triggerExpression(expression: 'happy' | 'surprised' | 'thoughtful' | 'neutral'): void {
    const expressions = {
      happy: { eyebrowHeight: 0.05, eyeSize: 1.1, mouthCurve: 0.3, cheekRaise: 0.1 },
      surprised: { eyebrowHeight: 0.1, eyeSize: 1.3, mouthCurve: 0, cheekRaise: 0 },
      thoughtful: { eyebrowHeight: -0.03, eyeSize: 0.9, mouthCurve: 0.05, cheekRaise: 0 },
      neutral: { eyebrowHeight: 0, eyeSize: 1, mouthCurve: 0.1, cheekRaise: 0 }
    };
    
    this.currentExpression = expressions[expression];
    
    // Auto-return to neutral after 3 seconds unless speaking
    if (expression !== 'neutral' && !this.isSpeaking) {
      setTimeout(() => {
        if (!this.isSpeaking) {
          this.currentExpression = expressions.neutral;
        }
      }, 3000);
    }
  }
}
