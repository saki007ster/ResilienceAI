import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { GoogleAuth, GoogleAuthState, GoogleUser } from '../../services/google-auth';
import { Calendar, CalendarState, CalendarEvent, CoachAvailability, TimeSlot } from '../../services/calendar';

interface SchedulingStep {
  id: 'auth' | 'coach' | 'date' | 'time' | 'topic' | 'confirm' | 'complete';
  title: string;
  description: string;
  completed: boolean;
}

@Component({
  selector: 'app-schedule-flow',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule-flow.html',
  styleUrl: './schedule-flow.scss'
})
export class ScheduleFlow implements OnInit, OnDestroy {
  // Authentication state
  authState: GoogleAuthState = {
    isAuthenticated: false,
    isLoading: false
  };

  // Calendar state
  calendarState: CalendarState = {
    isLoading: false,
    events: [],
    availability: []
  };

  // Scheduling flow state
  currentStep: SchedulingStep['id'] = 'auth';
  selectedCoach?: CoachAvailability;
  selectedDate?: Date;
  selectedTimeSlot?: TimeSlot;
  sessionTopic = '';
  scheduledEvent?: CalendarEvent;

  // UI state
  showDatePicker = false;
  isScheduling = false;
  error?: string;
  tempClientId = '';

  // Available dates (next 30 days, excluding weekends)
  availableDates: Date[] = [];

  // Scheduling steps
  steps: SchedulingStep[] = [
    {
      id: 'auth',
      title: 'Connect Google Calendar',
      description: 'Sign in to access your calendar',
      completed: false
    },
    {
      id: 'coach',
      title: 'Choose Your Coach',
      description: 'Select a wellness expert',
      completed: false
    },
    {
      id: 'date',
      title: 'Pick a Date',
      description: 'Choose your preferred day',
      completed: false
    },
    {
      id: 'time',
      title: 'Select Time',
      description: 'Find an available slot',
      completed: false
    },
    {
      id: 'topic',
      title: 'Session Focus',
      description: 'What would you like to discuss?',
      completed: false
    },
    {
      id: 'confirm',
      title: 'Confirm Booking',
      description: 'Review and schedule',
      completed: false
    },
    {
      id: 'complete',
      title: 'All Set!',
      description: 'Your session is booked',
      completed: false
    }
  ];

  private authSubscription?: Subscription;
  private calendarSubscription?: Subscription;

  constructor(
    private googleAuth: GoogleAuth,
    private calendar: Calendar
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication state
    this.authSubscription = this.googleAuth.state$.subscribe(
      state => {
        console.log('[ScheduleFlow] Auth state changed:', { 
          isAuthenticated: state.isAuthenticated, 
          isLoading: state.isLoading,
          hasUser: !!state.user,
          error: state.error 
        });
        
        this.authState = state;
        this.updateStepCompletion('auth', state.isAuthenticated);
        
        if (state.isAuthenticated && this.currentStep === 'auth') {
          console.log('[ScheduleFlow] User authenticated, moving to coach selection');
          this.goToStep('coach');
        }
      }
    );

    // Subscribe to calendar state
    this.calendarSubscription = this.calendar.state$.subscribe(
      state => {
        this.calendarState = state;
      }
    );

    // Generate available dates
    this.generateAvailableDates();

    // Check for OAuth callback
    this.checkForAuthCallback();
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.calendarSubscription?.unsubscribe();
  }

  /**
   * Check for OAuth callback in URL
   */
  private checkForAuthCallback(): void {
    const url = window.location.href;
    if (url.includes('/auth/callback') || url.includes('code=')) {
      console.log('[ScheduleFlow] Processing OAuth callback...');
      this.googleAuth.handleCallback(url).then(success => {
        if (success) {
          console.log('[ScheduleFlow] OAuth callback successful');
          // The auth state subscription will handle moving to next step
        } else {
          console.log('[ScheduleFlow] OAuth callback failed');
          // Error will be shown via auth state
        }
      });
    }
  }

  /**
   * Start Google OAuth flow
   */
  async signInWithGoogle(): Promise<void> {
    this.error = undefined;
    await this.googleAuth.signIn();
  }

  /**
   * Sign out of Google
   */
  async signOut(): Promise<void> {
    await this.googleAuth.signOut();
    this.resetSchedulingFlow();
  }

  /**
   * Select a coach and move to date selection
   */
  selectCoach(coach: CoachAvailability): void {
    this.selectedCoach = coach;
    this.updateStepCompletion('coach', true);
    this.goToStep('date');
  }

  /**
   * Select a date and load coach availability
   */
  async selectDate(date: Date): Promise<void> {
    this.selectedDate = date;
    this.selectedTimeSlot = undefined;
    this.updateStepCompletion('date', true);

    // Load coach availability for the selected date
    if (this.selectedCoach) {
      await this.loadCoachAvailability(date);
    }

    this.goToStep('time');
  }

  /**
   * Select a time slot
   */
  selectTimeSlot(timeSlot: TimeSlot): void {
    this.selectedTimeSlot = timeSlot;
    this.updateStepCompletion('time', true);
    this.goToStep('topic');
  }

  /**
   * Set session topic and move to confirmation
   */
  setSessionTopic(): void {
    this.updateStepCompletion('topic', !!this.sessionTopic.trim());
    this.goToStep('confirm');
  }

  /**
   * Schedule the appointment
   */
  async scheduleAppointment(): Promise<void> {
    if (!this.selectedCoach || !this.selectedTimeSlot) {
      this.error = 'Missing required information';
      return;
    }

    this.isScheduling = true;
    this.error = undefined;

    try {
      const startTime = this.selectedTimeSlot.start;
      const endTime = this.selectedTimeSlot.end;
      const topic = this.sessionTopic.trim() || undefined;

      const event = await this.calendar.scheduleAppointment(
        this.selectedCoach.coachId,
        startTime,
        endTime,
        topic
      );

      if (event) {
        this.scheduledEvent = event;
        this.updateStepCompletion('confirm', true);
        this.updateStepCompletion('complete', true);
        this.goToStep('complete');
      } else {
        throw new Error('Failed to schedule appointment');
      }

    } catch (error) {
      console.error('[ScheduleFlow] Scheduling failed:', error);
      this.error = error instanceof Error ? error.message : 'Failed to schedule appointment';
    } finally {
      this.isScheduling = false;
    }
  }

  /**
   * Load coach availability for a specific date
   */
  private async loadCoachAvailability(date: Date): Promise<void> {
    try {
      const availability = await this.calendar.getCoachAvailability(date, 60);
      
      // Update the selected coach with availability data
      if (this.selectedCoach) {
        const coachAvailability = availability.find(
          a => a.coachId === this.selectedCoach!.coachId
        );
        if (coachAvailability) {
          this.selectedCoach = coachAvailability;
        }
      }
    } catch (error) {
      console.error('[ScheduleFlow] Failed to load availability:', error);
      this.error = 'Failed to load available time slots';
    }
  }

  /**
   * Generate available dates (next 30 days, excluding weekends)
   */
  private generateAvailableDates(): void {
    const dates: Date[] = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Exclude weekends
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date);
      }
    }
    
    this.availableDates = dates;
  }

  /**
   * Navigate to a specific step
   */
  goToStep(stepId: SchedulingStep['id']): void {
    this.currentStep = stepId;
    this.error = undefined;
  }

  /**
   * Go back to previous step
   */
  goBack(): void {
    const stepOrder: SchedulingStep['id'][] = ['auth', 'coach', 'date', 'time', 'topic', 'confirm', 'complete'];
    const currentIndex = stepOrder.indexOf(this.currentStep);
    
    if (currentIndex > 0) {
      this.currentStep = stepOrder[currentIndex - 1];
    }
  }

  /**
   * Update step completion status
   */
  private updateStepCompletion(stepId: SchedulingStep['id'], completed: boolean): void {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      step.completed = completed;
    }
  }

  /**
   * Reset the scheduling flow
   */
  resetSchedulingFlow(): void {
    this.currentStep = 'auth';
    this.selectedCoach = undefined;
    this.selectedDate = undefined;
    this.selectedTimeSlot = undefined;
    this.sessionTopic = '';
    this.scheduledEvent = undefined;
    this.error = undefined;
    
    // Reset step completion
    this.steps.forEach(step => {
      step.completed = false;
    });
  }

  /**
   * Get initials from a full name
   */
  getInitials(fullName: string): string {
    return fullName.split(' ').map(name => name[0]).join('');
  }

  /**
   * Get initials safely with null check
   */
  getInitialsSafe(fullName?: string): string {
    return fullName ? this.getInitials(fullName) : '';
  }

  /**
   * Open Google Calendar link in new tab
   */
  openInGoogleCalendar(htmlLink: string): void {
    window.open(htmlLink, '_blank');
  }

  /**
   * Open Google Calendar link safely
   */
  openInGoogleCalendarSafe(htmlLink?: string): void {
    if (htmlLink) {
      this.openInGoogleCalendar(htmlLink);
    }
  }

  /**
   * Join array of strings with separator
   */
  joinArray(arr: string[], separator: string = ', '): string {
    return arr.join(separator);
  }

  /**
   * Join array safely with null check
   */
  joinArraySafe(arr?: string[], separator: string = ', '): string {
    return arr ? this.joinArray(arr, separator) : '';
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Format time for display
   */
  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Get current user
   */
  get currentUser(): GoogleUser | undefined {
    return this.authState.user;
  }

  /**
   * Get available time slots for selected coach and date
   */
  get availableTimeSlots(): TimeSlot[] {
    return this.selectedCoach?.timeSlots?.filter(slot => slot.available) || [];
  }

  /**
   * Check if we can proceed to next step
   */
  canProceed(): boolean {
    switch (this.currentStep) {
      case 'auth':
        return this.authState.isAuthenticated;
      case 'coach':
        return !!this.selectedCoach;
      case 'date':
        return !!this.selectedDate;
      case 'time':
        return !!this.selectedTimeSlot;
      case 'topic':
        return true; // Topic is optional
      case 'confirm':
        return !this.isScheduling;
      default:
        return false;
    }
  }

  /**
   * Get step progress percentage
   */
  get progressPercentage(): number {
    const completedSteps = this.steps.filter(step => step.completed).length;
    return Math.round((completedSteps / this.steps.length) * 100);
  }

  /**
   * Check if OAuth is properly configured
   */
  isOAuthConfigured(): boolean {
    return this.googleAuth.isConfigured();
  }

  /**
   * Get redirect URI for OAuth setup
   */
  getRedirectUri(): string {
    return `${window.location.origin}/auth/callback`;
  }

  /**
   * Update Google Client ID
   */
  updateClientId(): void {
    if (this.tempClientId.trim()) {
      this.googleAuth.setClientId(this.tempClientId.trim());
    }
  }

  /**
   * Debug authentication state (for troubleshooting)
   */
  debugAuth(): void {
    console.log('=== AUTHENTICATION DEBUG ===');
    console.log('Current auth state:', this.authState);
    console.log('Google Auth service configured:', this.googleAuth.isConfigured());
    console.log('Google Auth service authenticated:', this.googleAuth.isAuthenticated());
    console.log('localStorage tokens:', localStorage.getItem('google_tokens'));
    console.log('localStorage client_id:', localStorage.getItem('google_client_id'));
    console.log('Current URL:', window.location.href);
    console.log('Current step:', this.currentStep);
    console.log('================================');
  }
}
