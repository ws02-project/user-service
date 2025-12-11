import * as grpc from '@grpc/grpc-js';

export interface GrpcServiceError extends Error {
  code?: grpc.status;
  details?: string;
  metadata?: grpc.Metadata;
}

export type GrpcCallback<T> = (error: grpc.ServiceError | null, response?: T) => void;

export interface UserProto {
  id: string;
  subject: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  avatar_url: string;
  role: number;
  status: number;
  organization_id: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, string>;
}

export interface GetUserRequest {
  user_id: string;
}

export interface GetUserBySubjectRequest {
  subject: string;
}

export interface GetUsersRequest {
  user_ids: string[];
}

export interface SyncUserRequest {
  subject: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
  organization_id?: string;
  claims?: Record<string, string>;
}

export interface ValidateTokenRequest {
  access_token: string;
}

export interface GetUsersByOrganizationRequest {
  organization_id: string;
  page?: number;
  page_size?: number;
}








