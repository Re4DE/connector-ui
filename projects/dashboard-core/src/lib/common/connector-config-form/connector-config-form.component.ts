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

import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EdcClientService } from '../../services/edc-client.service';
import { DashboardStateService } from '../../services/dashboard-state.service';
import { NgClass } from '@angular/common';
import { EdcConfig } from '../../models/edc-config';
import { EdcConnectorClient, HealthStatus } from '@think-it-labs/edc-connector-client';
import { AlertComponent } from '../alert/alert.component';
import { DID_WEB_REGEX, URL_REGEX } from '../../models/constants';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'lib-connector-config-form',
  standalone: true,
  templateUrl: './connector-config-form.component.html',
  imports: [ReactiveFormsModule, NgClass, AlertComponent],
})
export class ConnectorConfigFormComponent implements OnInit {
  @Output() created = new EventEmitter<void>();
  private edcConfigs: Promise<EdcConfig[]> | undefined;

  ngOnInit() {
    // Initialize form with default values if needed
    this.edcConfigs = firstValueFrom(this.http.get<EdcConfig[]>('config/edc-connector-config.json'));
    // Get first config as default values
    this.edcConfigs.then(configs => {
      if (configs && configs.length > 0) {
        const defaultConfig = configs[0];
        this.connectorForm.patchValue({
          connectorName: defaultConfig.connectorName,
          managementUrl: defaultConfig.managementUrl,
          defaultUrl: defaultConfig.defaultUrl,
          protocolUrl: defaultConfig.protocolUrl,
          apiToken: defaultConfig.apiToken || '',
          federatedCatalogEnabled: defaultConfig.federatedCatalogEnabled || false,
          identityHubEnabled: !!defaultConfig.did,
        });
        if (defaultConfig.federatedCatalogEnabled) {
          this.onFederatedCatalogToggle();
          this.connectorForm.patchValue({
            federatedCatalogUrl: defaultConfig.federatedCatalogUrl || '',
          });
        }
        if (defaultConfig.did) {
          this.onIdentityHubToggle();
          this.connectorForm.patchValue({
            did: defaultConfig.did,
          });
        }
        const apiToken = this.edc.getCookie();
        if (apiToken) {
          this.connectorForm.patchValue({ apiToken: apiToken });
        }
      }
    });
  }

  connectorForm: FormGroup = new FormGroup({
    connectorName: new FormControl('', Validators.required),
    managementUrl: new FormControl('', [Validators.required, Validators.pattern(URL_REGEX)]),
    defaultUrl: new FormControl('', [Validators.required, Validators.pattern(URL_REGEX)]),
    protocolUrl: new FormControl('', [Validators.required, Validators.pattern(URL_REGEX)]),
    apiToken: new FormControl('', Validators.required),
    federatedCatalogEnabled: new FormControl(false),
    identityHubEnabled: new FormControl(false),
  });

  fcEnabled = false;
  ihEnabled = false;
  loading = false;
  errorMsg = '';

  constructor(
    private readonly edc: EdcClientService,
    private readonly stateService: DashboardStateService,
    private readonly http: HttpClient,
  ) {}

  onFederatedCatalogToggle() {
    this.fcEnabled = !this.fcEnabled;
    if (this.fcEnabled) {
      this.connectorForm.addControl(
        'federatedCatalogUrl',
        new FormControl('', [Validators.required, Validators.pattern(URL_REGEX)]),
      );
    } else {
      this.connectorForm.removeControl('federatedCatalogUrl');
    }
  }

  onIdentityHubToggle() {
    this.ihEnabled = !this.ihEnabled;
    if (this.ihEnabled) {
      this.connectorForm.addControl(
        'did',
        new FormControl('', [Validators.required, Validators.pattern(DID_WEB_REGEX)]),
      );
    } else {
      this.connectorForm.removeControl('did');
    }
  }

  /**
   * Adds a new EDC connector based on the form values.
   * Emits the 'created' event upon successful addition.
   * Currently not used because this form is only for saving a cookie.
   */
  async addConnector() {
    const edcConfig = this.getConnectorFormEdcConfig();
    if (this.connectorForm.value.apiToken) {
      this.saveApiTokenCookie();
    }
    const client: EdcConnectorClient = this.edc.createEdcConnectorClient(edcConfig);
    this.loading = true;
    try {
      const status: HealthStatus = await client.observability.checkHealth();
      if (status.isSystemHealthy) {
        this.stateService.addLocalStorageEdcConfig(edcConfig);
        this.created.emit();
      } else {
        this.errorMsg = 'The connector is unhealthy.';
      }
    } catch (error) {
      if (error instanceof TypeError) {
        this.errorMsg = error.message;
      } else {
        this.errorMsg = `Could not reach the default API '${edcConfig.defaultUrl}'. Please check your inputs.`;
      }
    } finally {
      this.loading = false;
    }
  }

  /**
   * Constructs an EdcConfig object from the form values.
   * @returns EdcConfig
   */
  getConnectorFormEdcConfig(): EdcConfig {
    const edcConfig: EdcConfig = {
      connectorName: this.connectorForm.value.connectorName,
      managementUrl: this.connectorForm.value.managementUrl,
      defaultUrl: this.connectorForm.value.defaultUrl,
      protocolUrl: this.connectorForm.value.protocolUrl,
      federatedCatalogEnabled: this.connectorForm.value.federatedCatalogEnabled,
    };
    if (edcConfig.federatedCatalogEnabled) {
      edcConfig.federatedCatalogUrl = this.connectorForm.value.federatedCatalogUrl;
    }
    if (this.connectorForm.value.identityHubEnabled) {
      edcConfig.did = this.connectorForm.value.did;
    }
    return edcConfig;
  }

  /**
   * Saves the API token acceptance in a cookie.
   * @param days
   * @param path
   */
  saveApiTokenCookie({ days = 30, path = '/' } = {}) {
    if (this.connectorForm.valid) {
      const token = this.connectorForm.value.apiToken;
      const maxAge = Math.floor(days * 86400);
      document.cookie = `${this.edc.EDC_API_TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${maxAge}; Path=${path}; SameSite=Strict; Secure`;
      const edcConfig = this.getConnectorFormEdcConfig();
      this.stateService.setCurrentEdcConfig(edcConfig);
    }
  }
}
