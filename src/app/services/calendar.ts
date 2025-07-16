import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GoogleAuth } from './google-auth';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: {
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }[];
  location?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink?: string;
  created?: string;
  updated?: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface CoachAvailability {
  coachId: string;
  coachName: string;
  coachEmail: string;
  timeSlots: TimeSlot[];
  specialties: string[];
  location?: string;
}

export interface CalendarState {
  isLoading: boolean;
  events: CalendarEvent[];
  availability: CoachAvailability[];
  error?: string;
  lastSync?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class Calendar {
  private readonly CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
  private readonly PRIMARY_CALENDAR = 'primary';
  private readonly RESILIENCE_CALENDAR_ID = 'resilience-coaches@example.com'; // Demo calendar

  private stateSubject = new BehaviorSubject<CalendarState>({
    isLoading: false,
    events: [],
    availability: []
  });

  public state$ = this.stateSubject.asObservable();

  // Mock coach data for demonstration
  private readonly MOCK_COACHES: CoachAvailability[] = [
    {
      coachId: 'coach-1',
      coachName: 'Dr. Sarah Johnson',
      coachEmail: 'sarah.johnson@resilience.ai',
      specialties: ['Anxiety Management', 'Stress Reduction', 'Mindfulness'],
      location: 'Video Call',
      timeSlots: []
    },
    {
      coachId: 'coach-2', 
      coachName: 'Michael Chen',
      coachEmail: 'michael.chen@resilience.ai',
      specialties: ['Career Counseling', 'Goal Setting', 'Work-Life Balance'],
      location: 'Video Call',
      timeSlots: []
    },
    {
      coachId: 'coach-3',
      coachName: 'Dr. Emily Rodriguez',
      coachEmail: 'emily.rodriguez@resilience.ai',
      specialties: ['Depression Support', 'Relationship Issues', 'Self-Esteem'],
      location: 'Video Call',
      timeSlots: []
    }
  ];

  constructor(private googleAuth: GoogleAuth) {}

  /**
   * Get user's upcoming appointments
   */
  async getUpcomingAppointments(limit: number = 10): Promise<CalendarEvent[]> {
    try {
      this.updateState({ isLoading: true, error: undefined });

      const accessToken = await this.googleAuth.getAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated with Google');
      }

      const now = new Date().toISOString();
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

      const url = `${this.CALENDAR_API_BASE}/calendars/${this.PRIMARY_CALENDAR}/events`;
      const params = new URLSearchParams({
        timeMin: now,
        timeMax: timeMax,
        maxResults: limit.toString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        q: 'Resilience AI Coach' // Filter for coaching appointments
      });

      const response = await fetch(`${url}?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.statusText}`);
      }

      const data = await response.json();
      const events: CalendarEvent[] = data.items?.map((item: any) => ({
        id: item.id,
        summary: item.summary,
        description: item.description,
        start: item.start,
        end: item.end,
        attendees: item.attendees,
        location: item.location,
        status: item.status,
        htmlLink: item.htmlLink,
        created: item.created,
        updated: item.updated
      })) || [];

      this.updateState({ 
        isLoading: false, 
        events,
        lastSync: new Date()
      });

      console.log('[Calendar] ✅ Loaded upcoming appointments:', events.length);
      return events;

    } catch (error) {
      console.error('[Calendar] Failed to load appointments:', error);
      this.updateState({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load appointments' 
      });
      return [];
    }
  }

  /**
   * Get available time slots from coaches
   */
  async getCoachAvailability(date: Date, durationMinutes: number = 60): Promise<CoachAvailability[]> {
    try {
      this.updateState({ isLoading: true, error: undefined });

      // For demo purposes, generate mock availability
      // In production, this would query coach calendars or a scheduling system
      const availability = this.generateMockAvailability(date, durationMinutes);

      this.updateState({ 
        isLoading: false,
        availability,
        lastSync: new Date()
      });

      console.log('[Calendar] ✅ Generated coach availability for', date.toDateString());
      return availability;

    } catch (error) {
      console.error('[Calendar] Failed to load coach availability:', error);
      this.updateState({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load availability' 
      });
      return [];
    }
  }

  /**
   * Schedule an appointment with a coach
   */
  async scheduleAppointment(
    coachId: string,
    startTime: Date,
    endTime: Date,
    topic?: string
  ): Promise<CalendarEvent | null> {
    try {
      this.updateState({ isLoading: true, error: undefined });

      const accessToken = await this.googleAuth.getAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated with Google');
      }

      const coach = this.MOCK_COACHES.find(c => c.coachId === coachId);
      if (!coach) {
        throw new Error('Coach not found');
      }

      const user = this.googleAuth.getCurrentUser();
      if (!user) {
        throw new Error('User not found');
      }

      // Create calendar event
      const event: CalendarEvent = {
        summary: `Resilience AI Coach Session - ${coach.coachName}`,
        description: this.generateAppointmentDescription(coach, topic, user.name),
        start: {
          dateTime: startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        attendees: [
          {
            email: user.email,
            displayName: user.name
          },
          {
            email: coach.coachEmail,
            displayName: coach.coachName
          }
        ],
        location: coach.location || 'Video Call'
      };

      const response = await fetch(`${this.CALENDAR_API_BASE}/calendars/${this.PRIMARY_CALENDAR}/events`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create appointment: ${error.error?.message || response.statusText}`);
      }

      const createdEvent = await response.json();
      const appointmentEvent: CalendarEvent = {
        id: createdEvent.id,
        summary: createdEvent.summary,
        description: createdEvent.description,
        start: createdEvent.start,
        end: createdEvent.end,
        attendees: createdEvent.attendees,
        location: createdEvent.location,
        status: createdEvent.status,
        htmlLink: createdEvent.htmlLink,
        created: createdEvent.created,
        updated: createdEvent.updated
      };

      // Update local state
      const currentState = this.stateSubject.value;
      this.updateState({
        isLoading: false,
        events: [...currentState.events, appointmentEvent],
        lastSync: new Date()
      });

      console.log('[Calendar] ✅ Appointment scheduled:', appointmentEvent.id);
      return appointmentEvent;

    } catch (error) {
      console.error('[Calendar] Failed to schedule appointment:', error);
      this.updateState({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to schedule appointment' 
      });
      return null;
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(eventId: string): Promise<boolean> {
    try {
      this.updateState({ isLoading: true, error: undefined });

      const accessToken = await this.googleAuth.getAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated with Google');
      }

      const response = await fetch(
        `${this.CALENDAR_API_BASE}/calendars/${this.PRIMARY_CALENDAR}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to cancel appointment: ${response.statusText}`);
      }

      // Update local state
      const currentState = this.stateSubject.value;
      this.updateState({
        isLoading: false,
        events: currentState.events.filter(event => event.id !== eventId),
        lastSync: new Date()
      });

      console.log('[Calendar] ✅ Appointment cancelled:', eventId);
      return true;

    } catch (error) {
      console.error('[Calendar] Failed to cancel appointment:', error);
      this.updateState({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to cancel appointment' 
      });
      return false;
    }
  }

  /**
   * Generate mock coach availability for demonstration
   */
  private generateMockAvailability(date: Date, durationMinutes: number): CoachAvailability[] {
    const availability: CoachAvailability[] = [];

    for (const coach of this.MOCK_COACHES) {
      const timeSlots: TimeSlot[] = [];
      const startDate = new Date(date);
      startDate.setHours(9, 0, 0, 0); // Start at 9 AM

      // Generate slots from 9 AM to 5 PM
      for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += durationMinutes) {
          const slotStart = new Date(startDate);
          slotStart.setHours(hour, minute, 0, 0);
          
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

          // Randomly make some slots unavailable for realism
          const available = Math.random() > 0.3; // 70% available

          timeSlots.push({
            start: slotStart,
            end: slotEnd,
            available
          });
        }
      }

      availability.push({
        ...coach,
        timeSlots
      });
    }

    return availability;
  }

  /**
   * Generate appointment description
   */
  private generateAppointmentDescription(
    coach: CoachAvailability,
    topic?: string,
    userName?: string
  ): string {
    let description = `Resilience AI Coach Session\n\n`;
    description += `Coach: ${coach.coachName}\n`;
    description += `Specialties: ${coach.specialties.join(', ')}\n`;
    
    if (userName) {
      description += `Client: ${userName}\n`;
    }
    
    if (topic) {
      description += `Session Topic: ${topic}\n`;
    }
    
    description += `\nThis session was scheduled through the Resilience AI platform.\n`;
    description += `Please join the video call at the scheduled time.\n\n`;
    description += `If you need to reschedule or cancel, please do so at least 24 hours in advance.`;
    
    return description;
  }

  /**
   * Get current calendar state
   */
  getCurrentState(): CalendarState {
    return this.stateSubject.value;
  }

  /**
   * Check if user has authentication for calendar access
   */
  canAccessCalendar(): boolean {
    return this.googleAuth.isAuthenticated();
  }

  /**
   * Update calendar state
   */
  private updateState(update: Partial<CalendarState>): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, ...update });
  }

  /**
   * Get list of available coaches (without time slots)
   */
  async getAvailableCoaches(): Promise<CoachAvailability[]> {
    try {
      console.log('[Calendar] Loading available coaches...');
      
      // Return mock coaches for demo (in production, this would fetch from a coaches API)
      const coaches = this.MOCK_COACHES.map(coach => ({
        ...coach,
        timeSlots: [] // No time slots needed for initial coach selection
      }));

      this.updateState({ 
        isLoading: false,
        availability: coaches,
        lastSync: new Date()
      });

      console.log('[Calendar] ✅ Loaded', coaches.length, 'available coaches');
      return coaches;

    } catch (error) {
      console.error('[Calendar] Failed to load coaches:', error);
      this.updateState({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load coaches' 
      });
      return [];
    }
  }
}
