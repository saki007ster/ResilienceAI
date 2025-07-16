import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface AvatarOption {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  vrmUrl: string;
  category: 'male' | 'female' | 'anime' | 'fantasy';
  tags: string[];
  isDefault?: boolean;
  isFree?: boolean;
}

@Component({
  selector: 'app-avatar-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar-selector.html',
  styleUrl: './avatar-selector.scss'
})
export class AvatarSelector {
  @Input() currentAvatarId: string = 'default';
  @Output() avatarSelected = new EventEmitter<AvatarOption>();
  @Output() customAvatarUploaded = new EventEmitter<string>();

  selectedCategory: string = 'all';
  isOpen = false;

  // Predefined avatar options with public folder URLs
  availableAvatars: AvatarOption[] = [
    {
      id: 'default',
      name: 'Default Avatar',
      description: 'Simple geometric avatar for testing',
      previewImage: '/assets/avatars/previews/default.svg',
      vrmUrl: '/assets/avatars/default.vrm',
      category: 'anime',
      tags: ['simple', 'default', 'testing'],
      isDefault: true,
      isFree: true
    },
    {
      id: 'wellness-coach',
      name: 'Wellness Coach',
      description: 'Professional wellness coaching avatar',
      previewImage: '/assets/avatars/previews/wellness-coach.svg',
      vrmUrl: 'https://cdn.vroid.com/sample/wellness-coach.vrm',
      category: 'female',
      tags: ['professional', 'coach', 'wellness'],
      isFree: true
    },
    {
      id: 'friendly-male',
      name: 'Friendly Therapist',
      description: 'Approachable male counselor avatar',
      previewImage: '/assets/avatars/previews/friendly-male.svg',
      vrmUrl: 'https://cdn.vroid.com/sample/friendly-male.vrm',
      category: 'male',
      tags: ['therapist', 'friendly', 'professional'],
      isFree: true
    },
    {
      id: 'anime-girl',
      name: 'Anime Assistant',
      description: 'Cute anime-style support character',
      previewImage: '/assets/avatars/previews/anime-girl.svg',
      vrmUrl: 'https://cdn.vroid.com/sample/anime-girl.vrm',
      category: 'anime',
      tags: ['anime', 'cute', 'assistant'],
      isFree: true
    },
    {
      id: 'meditation-guide',
      name: 'Zen Guide',
      description: 'Peaceful meditation instructor',
      previewImage: '/assets/avatars/previews/zen-guide.svg',
      vrmUrl: 'https://cdn.vroid.com/sample/zen-guide.vrm',
      category: 'fantasy',
      tags: ['meditation', 'zen', 'peaceful'],
      isFree: true
    }
  ];

  categories = [
    { id: 'all', name: 'All Avatars', icon: '👥' },
    { id: 'male', name: 'Male', icon: '👨' },
    { id: 'female', name: 'Female', icon: '👩' },
    { id: 'anime', name: 'Anime Style', icon: '🎭' },
    { id: 'fantasy', name: 'Fantasy', icon: '🧙' }
  ];

  get filteredAvatars(): AvatarOption[] {
    if (this.selectedCategory === 'all') {
      return this.availableAvatars;
    }
    return this.availableAvatars.filter(avatar => avatar.category === this.selectedCategory);
  }

  get currentAvatar(): AvatarOption | undefined {
    return this.availableAvatars.find(avatar => avatar.id === this.currentAvatarId);
  }

  toggleSelector(): void {
    this.isOpen = !this.isOpen;
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
  }

  selectAvatar(avatar: AvatarOption): void {
    this.currentAvatarId = avatar.id;
    this.avatarSelected.emit(avatar);
    this.isOpen = false;
  }

  onCustomAvatarUpload(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    
    if (file && file.name.endsWith('.vrm')) {
      // Create a blob URL for the uploaded file
      const blobUrl = URL.createObjectURL(file);
      this.customAvatarUploaded.emit(blobUrl);
      this.isOpen = false;
      
      // Optionally add to available avatars list
      const customAvatar: AvatarOption = {
        id: `custom-${Date.now()}`,
        name: file.name.replace('.vrm', ''),
        description: 'Custom uploaded avatar',
        previewImage: '/assets/avatars/previews/custom.svg',
        vrmUrl: blobUrl,
        category: 'anime',
        tags: ['custom', 'uploaded'],
        isFree: true
      };
      
      this.availableAvatars.push(customAvatar);
      this.selectAvatar(customAvatar);
    } else {
      alert('Please select a valid .vrm file');
    }
  }

  downloadFromVRoidHub(): void {
    window.open('https://hub.vroid.com', '_blank');
  }

  learnAboutVRM(): void {
    window.open('https://vrm.dev/en/', '_blank');
  }
} 