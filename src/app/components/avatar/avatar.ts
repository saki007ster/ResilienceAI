import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { HeadTts, TTSState } from '../../services/head-tts';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.html',
  styleUrl: './avatar.scss'
})
export class Avatar implements OnInit, OnDestroy {
  @ViewChild('avatarCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() size: number = 200;
  @Input() isVisible: boolean = true;

  private ctx!: CanvasRenderingContext2D;
  private ttsSubscription?: Subscription;
  private animationId?: number;

  // Avatar state
  currentViseme = 'sil';
  isSpeaking = false;
  isAnimating = false;

  // Animation properties
  private eyeBlinkTimer = 0;
  private headBobTimer = 0;
  private eyesOpen = true;
  private headOffset = 0;

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
      console.log('Avatar: Canvas setup complete');
    }
  }

  private subscribeToTTS(): void {
    this.ttsSubscription = this.headTts.state$.subscribe((state: TTSState) => {
      this.currentViseme = state.currentViseme;
      this.isSpeaking = state.isSpeaking;
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
    // Eye blink animation
    this.eyeBlinkTimer += 16; // ~60fps
    if (this.eyeBlinkTimer > 3000 + Math.random() * 2000) { // Blink every 3-5 seconds
      this.eyesOpen = false;
      setTimeout(() => { this.eyesOpen = true; }, 150); // Blink duration
      this.eyeBlinkTimer = 0;
    }

    // Head bob animation (when speaking)
    if (this.isSpeaking) {
      this.headBobTimer += 16;
      this.headOffset = Math.sin(this.headBobTimer * 0.005) * 2; // Subtle head movement
    } else {
      this.headOffset = 0;
    }
  }

  private drawAvatar(): void {
    if (!this.ctx) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.size, this.size);

    if (!this.isVisible) return;

    const centerX = this.size / 2;
    const centerY = this.size / 2 + this.headOffset;

    // Draw head (circle)
    this.drawHead(centerX, centerY);
    
    // Draw eyes
    this.drawEyes(centerX, centerY);
    
    // Draw mouth based on current viseme
    this.drawMouth(centerX, centerY);

    // Draw speaking indicator when active
    if (this.isSpeaking) {
      this.drawSpeakingIndicator(centerX, centerY);
    }
  }

  private drawHead(x: number, y: number): void {
    const headRadius = this.size * 0.35;
    
    // Head shadow
    this.ctx.beginPath();
    this.ctx.arc(x + 2, y + 2, headRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fill();

    // Head
    this.ctx.beginPath();
    this.ctx.arc(x, y, headRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#fdbcb4'; // Skin tone
    this.ctx.fill();
    this.ctx.strokeStyle = '#e8a594';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private drawEyes(x: number, y: number): void {
    const eyeY = y - this.size * 0.1;
    const eyeSpacing = this.size * 0.12;
    const eyeWidth = this.size * 0.08;
    const eyeHeight = this.eyesOpen ? this.size * 0.05 : this.size * 0.01;

    // Left eye
    this.ctx.beginPath();
    this.ctx.ellipse(x - eyeSpacing, eyeY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = this.eyesOpen ? '#333' : '#fdbcb4';
    this.ctx.fill();

    // Right eye
    this.ctx.beginPath();
    this.ctx.ellipse(x + eyeSpacing, eyeY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = this.eyesOpen ? '#333' : '#fdbcb4';
    this.ctx.fill();

    // Eye highlights (when open)
    if (this.eyesOpen) {
      this.ctx.beginPath();
      this.ctx.ellipse(x - eyeSpacing + eyeWidth * 0.3, eyeY - eyeHeight * 0.2, eyeWidth * 0.3, eyeHeight * 0.3, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = '#fff';
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.ellipse(x + eyeSpacing + eyeWidth * 0.3, eyeY - eyeHeight * 0.2, eyeWidth * 0.3, eyeHeight * 0.3, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = '#fff';
      this.ctx.fill();
    }
  }

  private drawMouth(x: number, y: number): void {
    const mouthY = y + this.size * 0.15;
    
    // Get mouth shape based on viseme
    const mouthShape = this.getMouthShape(this.currentViseme);
    
    this.ctx.beginPath();
    this.ctx.fillStyle = '#8B0000'; // Dark red for mouth interior
    this.ctx.strokeStyle = '#444';
    this.ctx.lineWidth = 2;

    switch (mouthShape.type) {
      case 'oval':
        this.ctx.ellipse(x, mouthY, mouthShape.width, mouthShape.height, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        break;
      
      case 'line':
        this.ctx.moveTo(x - mouthShape.width, mouthY);
        this.ctx.lineTo(x + mouthShape.width, mouthY);
        this.ctx.stroke();
        break;
      
      case 'smile':
        this.ctx.arc(x, mouthY - mouthShape.height, mouthShape.width, 0.2, Math.PI - 0.2);
        this.ctx.stroke();
        break;
    }
  }

  private getMouthShape(viseme: string): { type: string; width: number; height: number } {
    const baseSize = this.size * 0.06;
    
    switch (viseme) {
      case 'aa': // Open vowels
        return { type: 'oval', width: baseSize * 1.2, height: baseSize * 1.5 };
      
      case 'E':
      case 'I':
        return { type: 'oval', width: baseSize * 0.8, height: baseSize * 0.8 };
      
      case 'O':
      case 'U':
        return { type: 'oval', width: baseSize * 0.6, height: baseSize * 1.2 };
      
      case 'PP': // Closed consonants
        return { type: 'line', width: baseSize * 0.5, height: 0 };
      
      case 'SS': // Sibilants
        return { type: 'oval', width: baseSize * 0.4, height: baseSize * 0.3 };
      
      case 'TH': // Dental
        return { type: 'oval', width: baseSize * 0.6, height: baseSize * 0.4 };
      
      case 'CH': // Affricates
        return { type: 'oval', width: baseSize * 0.7, height: baseSize * 0.6 };
      
      case 'FF': // Fricatives
        return { type: 'oval', width: baseSize * 0.5, height: baseSize * 0.4 };
      
      case 'kk': // Velars
        return { type: 'oval', width: baseSize * 0.8, height: baseSize * 0.6 };
      
      case 'nn': // Nasals
        return { type: 'line', width: baseSize * 0.6, height: 0 };
      
      case 'RR': // Liquids
        return { type: 'oval', width: baseSize * 0.7, height: baseSize * 0.5 };
      
      case 'DD': // Stops
        return { type: 'oval', width: baseSize * 0.6, height: baseSize * 0.5 };
      
      case 'sil': // Silence
      default:
        return { type: 'smile', width: baseSize * 0.8, height: baseSize * 0.2 };
    }
  }

  private drawSpeakingIndicator(x: number, y: number): void {
    const time = Date.now() * 0.01;
    const radius = this.size * 0.45;
    
    // Animated speaking rings
    for (let i = 0; i < 3; i++) {
      const ringRadius = radius + (i * 10) + (Math.sin(time + i) * 5);
      const opacity = 0.3 - (i * 0.1);
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(76, 175, 80, ${opacity})`;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  // Public methods for external control
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
}
