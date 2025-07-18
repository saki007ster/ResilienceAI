import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SettingsService } from '../services/settings.service';
import { map } from 'rxjs';

export const modelSelectedGuard: CanActivateFn = () => {
  const settingsService = inject(SettingsService);
  const router = inject(Router);

  return settingsService.settings$.pipe(
    map(settings => {
      if (settings.ai.selectedModel) {
        return true;
      } else {
        router.navigate(['/select-model']);
        return false;
      }
    })
  );
};

export const noModelSelectedGuard: CanActivateFn = () => {
  const settingsService = inject(SettingsService);
  const router = inject(Router);

  return settingsService.settings$.pipe(
    map(settings => {
      if (!settings.ai.selectedModel) {
        return true;
      } else {
        router.navigate(['/chat']);
        return false;
      }
    })
  );
}; 