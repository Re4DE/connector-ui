/*
 *  Copyright (c) 2025 Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V.
 *
 *  This program and the accompanying materials are made available under the
 *  terms of the Apache License, Version 2.0 which is available at
 *  https://www.apache.org/licenses/LICENSE-2.0
 *
 *  SPDX-License-Identifier: Apache-2.0
 *
 *  Contributors:
 *       Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V. - initial API and implementation
 *
 */

import { Routes } from '@angular/router';
import { tokenRequiredGuard } from '../../projects/dashboard-core/src/lib/auth/can-activate.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('@eclipse-edc/dashboard-core/home').then(m => m.HomeViewComponent),
    canActivate: [tokenRequiredGuard],
  },
  {
    path: 'assets',
    loadComponent: () => import('@eclipse-edc/dashboard-core/assets').then(m => m.AssetViewComponent),
    canActivate: [tokenRequiredGuard],
  },
  {
    path: 'policies',
    loadComponent: () => import('@eclipse-edc/dashboard-core/policies').then(m => m.PolicyViewComponent),
    canActivate: [tokenRequiredGuard],
  },
  {
    path: 'contract-definitions',
    loadComponent: () =>
      import('@eclipse-edc/dashboard-core/contract-definitions').then(m => m.ContractDefinitionsViewComponent),
    canActivate: [tokenRequiredGuard],
  },
  {
    path: 'contracts',
    loadComponent: () => import('@eclipse-edc/dashboard-core/transfer').then(m => m.ContractViewComponent),
    canActivate: [tokenRequiredGuard],
  },

  {
    path: 'catalog',
    loadComponent: () => import('@eclipse-edc/dashboard-core/catalog').then(m => m.CatalogViewComponent),
    canActivate: [tokenRequiredGuard],
  },
  {
    path: 'transfer-history',
    loadComponent: () => import('@eclipse-edc/dashboard-core/transfer').then(m => m.TransferHistoryViewComponent),
    canActivate: [tokenRequiredGuard],
  },
  {
    path: 'connector-config',
    loadComponent: () => import('@eclipse-edc/dashboard-core').then(m => m.ConnectorConfigFormComponent),
  },
];
