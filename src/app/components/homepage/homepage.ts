import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './homepage.html',
  styleUrls: ['./homepage.scss']
})
export class Homepage implements OnInit, AfterViewInit, OnDestroy {
  features = [
    {
      icon: '🤖',
      title: 'Real Local LLM',
      description: 'Powered by WebLLM with Llama 3.2, Qwen 2.5, and Gemma 2 models running entirely offline',
      highlight: 'No data ever leaves your device'
    },
    {
      icon: '🎭',
      title: 'VRM Avatars',
      description: '3D avatars with real-time lip-sync, facial expressions, and natural animations',
      highlight: 'Upload your own VRM files'
    },
    {
      icon: '🎨',
      title: 'Modern UI/UX',
      description: 'Glassmorphism design with full responsive layout optimized for all devices',
      highlight: 'Accessibility-first approach'
    },
    {
      icon: '🔒',
      title: 'Privacy First',
      description: 'Complete offline functionality with no external API calls or data collection',
      highlight: 'GDPR compliant by design'
    },
    {
      icon: '⚡',
      title: 'High Performance',
      description: 'WebGPU acceleration with WASM fallback for optimal AI inference speed',
      highlight: 'Hardware-accelerated 3D rendering'
    },
    {
      icon: '🌐',
      title: 'Progressive Web App',
      description: 'Install on any device with offline capability and native app experience',
      highlight: 'Works completely offline'
    }
  ];

  stats = [
    { number: '100%', label: 'Offline Operation' },
    { number: '4+', label: 'LLM Models' },
    { number: '3D', label: 'VRM Avatars' },
    { number: '60fps', label: 'Smooth Animations' }
  ];

  private animationFrame?: number;
  private isAnimating = false;

  ngOnInit() {
    console.log('Homepage component initialized');
  }

  ngAfterViewInit() {
    // Wait for view to be fully rendered before starting animations
    setTimeout(() => {
      this.startFloatingAnimation();
    }, 100);
  }

  ngOnDestroy() {
    this.stopFloatingAnimation();
  }

  private startFloatingAnimation() {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    
    const animate = () => {
      try {
        if (!this.isAnimating) return;
        
        const elements = document.querySelectorAll('.floating');
        if (elements.length > 0) {
          elements.forEach((el, index) => {
            if (el instanceof HTMLElement) {
              const offset = Math.sin(Date.now() * 0.001 + index) * 10;
              el.style.transform = `translateY(${offset}px)`;
            }
          });
        }
        
        if (this.isAnimating) {
          this.animationFrame = requestAnimationFrame(animate);
        }
      } catch (error) {
        console.warn('Animation error:', error);
        this.stopFloatingAnimation();
      }
    };
    
    animate();
  }

  private stopFloatingAnimation() {
    this.isAnimating = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
  }

  scrollToSection(sectionId: string) {
    try {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.warn('Scroll error:', error);
    }
  }
} 