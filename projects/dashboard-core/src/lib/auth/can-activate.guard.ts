import { CanActivateFn, Router } from '@angular/router';
import { EdcClientService } from '../services/edc-client.service';
import { inject } from '@angular/core';

/**
 * Guard that allows access only if a valid EDC API token is present.
 * If no token is found, the user is redirected to the connector configuration page.
 */
export const tokenRequiredGuard: CanActivateFn = () => {
  const edcClientService = inject(EdcClientService);
  const router = inject(Router);
  return edcClientService.getCookie() ? true : router.parseUrl('/connector-config');
};
