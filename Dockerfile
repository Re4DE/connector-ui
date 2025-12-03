#
#  Copyright (c) 2025 Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V.
#
#  This program and the accompanying materials are made available under the
#  terms of the Apache License, Version 2.0 which is available at
#  https://www.apache.org/licenses/LICENSE-2.0
#
#  SPDX-License-Identifier: Apache-2.0
#
#  Contributors:
#       Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V. - initial API and implementation
#

# Stage 1: Build the Angular application
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the full project and build it
COPY . .
RUN npm run lib-build -- --configuration production && npm run build -- --configuration production


# Stage 2: Serve the app with Nginx
FROM nginxinc/nginx-unprivileged:1.29.2-alpine-slim

RUN rm -rf /urs/share/nginx/html/*

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /usr/src/app/dist/data-dashboard/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
