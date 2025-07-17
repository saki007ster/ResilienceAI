import { Routes } from '@angular/router';
import { Homepage } from './components/homepage/homepage';
import { ChatWindow } from './components/chat-window/chat-window';
import { SettingsPage } from './components/settings-page/settings-page';
import { ScheduleFlow } from './components/schedule-flow/schedule-flow';

export const routes: Routes = [
  { path: '', component: Homepage },
  { path: 'chat', component: ChatWindow },
  { path: 'settings', component: SettingsPage },
  { path: 'schedule', component: ScheduleFlow },
  { path: 'auth/callback', component: ScheduleFlow },
  { path: '**', redirectTo: '/' }
];
