import { Routes } from '@angular/router';
import { ChatWindow } from './components/chat-window/chat-window';
import { SettingsPage } from './components/settings-page/settings-page';
import { ScheduleFlow } from './components/schedule-flow/schedule-flow';

export const routes: Routes = [
  { path: '', redirectTo: '/chat', pathMatch: 'full' },
  { path: 'chat', component: ChatWindow },
  { path: 'settings', component: SettingsPage },
  { path: 'schedule', component: ScheduleFlow }
];
