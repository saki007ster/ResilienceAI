import { Routes } from '@angular/router';
import { Homepage } from './components/homepage/homepage';
import { ChatWindow } from './components/chat-window/chat-window';
import { SettingsPage } from './components/settings-page/settings-page';
import { ScheduleFlow } from './components/schedule-flow/schedule-flow';
import { modelSelectedGuard, noModelSelectedGuard } from './guards/model-selection.guard';
import { ModelSelector } from './components/model-selector/model-selector';

export const routes: Routes = [
  { path: '', component: Homepage },
  { path: 'chat', component: ChatWindow, canActivate: [modelSelectedGuard] },
  { path: 'select-model', component: ModelSelector, canActivate: [noModelSelectedGuard] },
  { path: 'settings', component: SettingsPage },
  { path: 'schedule', component: ScheduleFlow },
  { path: 'auth/callback', component: ScheduleFlow },
  { path: '**', redirectTo: '/' }
];
