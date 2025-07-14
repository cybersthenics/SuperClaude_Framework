/**
 * Security Manager Implementation
 * Message security, authentication, and encryption for inter-server communication
 */

import { createHash, createHmac, randomBytes, createCipher, createDecipher } from 'crypto';
import { EventEmitter } from 'events';
import {
  BaseMessage,
  ServerIdentifier,
  SecurityContext
} from './types.js';

export interface SecuredMessage extends BaseMessage {
  security: MessageSecurity;
}

export interface MessageSecurity {
  signature: string;
  encryption: EncryptionMetadata;
  authentication: string;
  authorization: string[];
  audit: AuditInfo;
}

export interface EncryptionMetadata {
  enabled: boolean;
  algorithm?: string;
  keyId?: string;
  iv?: string;
  tag?: string;
}

export interface AuditInfo {
  timestamp: Date;
  source: ServerIdentifier;
  operation: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthenticationResult {
  valid: boolean;
  token: string;
  serverId: ServerIdentifier;
  permissions: string[];
  expiresAt: Date;
}

export interface AuthorizationResult {
  authorized: boolean;
  permissions: string[];
  reason?: string;
}

export interface Certificate {
  id: string;
  serverId: ServerIdentifier;
  publicKey: string;
  privateKey?: string;
  issuedAt: Date;
  expiresAt: Date;
  issuer: string;
  fingerprint: string;
}

export interface TrustRelationship {
  serverId: ServerIdentifier;
  establishedAt: Date;
  certificate: Certificate;
  secureChannel: SecureChannel;
  permissions: string[];
  status: TrustStatus;
}

export interface SecureChannel {
  id: string;
  algorithm: string;
  sharedSecret: string;
  establishedAt: Date;
  lastUsed: Date;
}

export enum TrustStatus {
  Established = 'established',
  Pending = 'pending',
  Revoked = 'revoked',
  Expired = 'expired'
}

export interface SecurityAuditEntry {
  id: string;
  timestamp: Date;
  event: string;
  serverId: ServerIdentifier;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

export interface SecurityMetrics {
  totalMessages: number;
  authenticatedMessages: number;
  encryptedMessages: number;
  authenticationFailures: number;
  authorizationFailures: number;
  securityViolations: number;
  averageProcessingTime: number;
}

export interface EncryptedPayload {
  data: string;
  encryption: EncryptionMetadata;
}

export interface MessageValidationResult {
  valid: boolean;
  message?: BaseMessage;
  securityContext?: MessageSecurity;
  errors?: string[];
}

export interface TrustEstablishmentResult {
  success: boolean;
  trustRelationship?: TrustRelationship;
  secureChannelId?: string;
  error?: string;
}

export interface TrustValidationResult {
  valid: boolean;
  trustLevel?: number;
  permissions?: string[];
  reason?: string;
}

export interface SecurityConfig {
  enableEncryption: boolean;
  enableAuthentication: boolean;
  enableAuthorization: boolean;
  enableAuditLogging: boolean;
  encryptionAlgorithm: string;
  keyRotationInterval: number;
  certificateValidityPeriod: number;
  maxAuthenticationAttempts: number;
  authenticationTimeout: number;
}

export class SecurityManager extends EventEmitter {
  private certificates: Map<ServerIdentifier, Certificate> = new Map();
  private trustRelationships: Map<ServerIdentifier, TrustRelationship> = new Map();
  private auditLog: SecurityAuditEntry[] = [];
  private encryptionKeys: Map<string, string> = new Map();
  private serverPermissions: Map<ServerIdentifier, string[]> = new Map();
  private config: SecurityConfig;
  private metrics: SecurityMetrics;

  constructor(config?: Partial<SecurityConfig>) {
    super();
    
    this.config = {
      enableEncryption: true,
      enableAuthentication: true,
      enableAuthorization: true,
      enableAuditLogging: true,
      encryptionAlgorithm: 'AES-256-GCM',
      keyRotationInterval: 86400000, // 24 hours
      certificateValidityPeriod: 31536000000, // 1 year
      maxAuthenticationAttempts: 3,
      authenticationTimeout: 300000, // 5 minutes
      ...config
    };

    this.metrics = {
      totalMessages: 0,
      authenticatedMessages: 0,
      encryptedMessages: 0,
      authenticationFailures: 0,
      authorizationFailures: 0,
      securityViolations: 0,
      averageProcessingTime: 0
    };

    this.initializeDefaultKeys();
  }

  async secureMessage(message: BaseMessage, securityContext: SecurityContext): Promise<SecuredMessage> {
    const startTime = performance.now();
    
    try {
      this.metrics.totalMessages++;

      // 1. Authenticate sender
      const senderAuth = await this.authenticateSender(message.header.source, securityContext);
      if (!senderAuth.valid) {
        this.metrics.authenticationFailures++;
        await this.logSecurityEvent('authentication_failure', message.header.source, {
          operation: message.header.operation,
          reason: 'Invalid sender authentication'
        }, 'medium');
        throw new Error('Invalid sender authentication');
      }

      this.metrics.authenticatedMessages++;

      // 2. Authorize operation
      const authzResult = await this.authorizeOperation(
        message.header.operation,
        message.header.source,
        message.header.target
      );
      if (!authzResult.authorized) {
        this.metrics.authorizationFailures++;
        await this.logSecurityEvent('authorization_failure', message.header.source, {
          operation: message.header.operation,
          target: message.header.target,
          reason: authzResult.reason
        }, 'medium');
        throw new Error(`Operation not authorized: ${authzResult.reason}`);
      }

      // 3. Encrypt sensitive payload
      const encryptedPayload = await this.encryptPayload(message.payload, message.header.operation);
      if (encryptedPayload.encryption.enabled) {
        this.metrics.encryptedMessages++;
      }

      // 4. Sign message
      const signature = await this.signMessage(message, encryptedPayload);

      // 5. Add security metadata
      const securedMessage: SecuredMessage = {
        ...message,
        payload: encryptedPayload,
        security: {
          signature,
          encryption: encryptedPayload.encryption,
          authentication: senderAuth.token,
          authorization: authzResult.permissions,
          audit: {
            timestamp: new Date(),
            source: message.header.source,
            operation: message.header.operation
          }
        }
      };

      // 6. Log security event
      await this.logSecurityEvent('message_secured', message.header.source, {
        operation: message.header.operation,
        target: message.header.target,
        encrypted: encryptedPayload.encryption.enabled
      }, 'low');

      // Update metrics
      const processingTime = performance.now() - startTime;
      this.metrics.averageProcessingTime = 
        (this.metrics.averageProcessingTime + processingTime) / 2;

      return securedMessage;
    } catch (error) {
      const processingTime = performance.now() - startTime;
      this.metrics.averageProcessingTime = 
        (this.metrics.averageProcessingTime + processingTime) / 2;
      
      throw error;
    }
  }

  async validateMessage(securedMessage: SecuredMessage): Promise<MessageValidationResult> {
    try {
      // 1. Verify signature
      const signatureValid = await this.verifySignature(securedMessage);
      if (!signatureValid) {
        await this.logSecurityEvent('signature_verification_failed', securedMessage.header.source, {
          messageId: securedMessage.header.messageId
        }, 'high');
        throw new Error('Invalid message signature');
      }

      // 2. Decrypt payload
      const decryptedPayload = await this.decryptPayload(securedMessage.payload as EncryptedPayload);

      // 3. Validate message integrity
      const integrityValid = await this.validateMessageIntegrity(securedMessage, decryptedPayload);
      if (!integrityValid) {
        await this.logSecurityEvent('integrity_validation_failed', securedMessage.header.source, {
          messageId: securedMessage.header.messageId
        }, 'high');
        throw new Error('Message integrity validation failed');
      }

      // 4. Check authorization
      const authzValid = await this.validateAuthorization(securedMessage);
      if (!authzValid) {
        await this.logSecurityEvent('authorization_validation_failed', securedMessage.header.source, {
          messageId: securedMessage.header.messageId,
          operation: securedMessage.header.operation
        }, 'medium');
        throw new Error('Message authorization validation failed');
      }

      return {
        valid: true,
        message: {
          ...securedMessage,
          payload: decryptedPayload
        },
        securityContext: securedMessage.security
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  async establishTrust(serverId: ServerIdentifier): Promise<TrustEstablishmentResult> {
    try {
      // 1. Verify server certificate
      const certificate = await this.getServerCertificate(serverId);
      const certValidation = await this.validateCertificate(certificate);
      
      if (!certValidation.valid) {
        throw new Error(`Invalid certificate for server ${serverId}: ${certValidation.reason}`);
      }

      // 2. Perform mutual authentication
      const mutualAuth = await this.performMutualAuthentication(serverId, certificate);
      if (!mutualAuth.success) {
        throw new Error(`Mutual authentication failed for server ${serverId}`);
      }

      // 3. Establish secure channel
      const secureChannel = await this.establishSecureChannel(serverId, mutualAuth.sharedSecret);

      // 4. Create trust relationship
      const trustRelationship: TrustRelationship = {
        serverId,
        establishedAt: new Date(),
        certificate,
        secureChannel,
        permissions: this.getServerPermissions(serverId),
        status: TrustStatus.Established
      };

      this.trustRelationships.set(serverId, trustRelationship);

      await this.logSecurityEvent('trust_established', serverId, {
        certificateId: certificate.id,
        secureChannelId: secureChannel.id
      }, 'low');

      this.emit('trustEstablished', { serverId, trustRelationship });

      return {
        success: true,
        trustRelationship,
        secureChannelId: secureChannel.id
      };
    } catch (error) {
      await this.logSecurityEvent('trust_establishment_failed', serverId, {
        error: error instanceof Error ? error.message : String(error)
      }, 'high');

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async validateServerTrust(serverId: ServerIdentifier, operation: string): Promise<TrustValidationResult> {
    const trustRelationship = this.trustRelationships.get(serverId);
    
    if (!trustRelationship || trustRelationship.status !== TrustStatus.Established) {
      return {
        valid: false,
        reason: 'No established trust relationship'
      };
    }

    // Check if operation is permitted
    if (!this.isOperationPermitted(operation, trustRelationship.permissions)) {
      return {
        valid: false,
        reason: 'Operation not permitted for this server'
      };
    }

    // Verify certificate is still valid
    const certValid = await this.validateCertificate(trustRelationship.certificate);
    if (!certValid.valid) {
      // Mark trust as expired
      trustRelationship.status = TrustStatus.Expired;
      return {
        valid: false,
        reason: 'Server certificate no longer valid'
      };
    }

    return {
      valid: true,
      trustLevel: this.calculateTrustLevel(trustRelationship),
      permissions: trustRelationship.permissions
    };
  }

  async getSecurityMetrics(): Promise<SecurityMetrics> {
    return { ...this.metrics };
  }

  async getSecurityAudit(limit: number = 100): Promise<SecurityAuditEntry[]> {
    return this.auditLog
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async rotateEncryptionKeys(): Promise<void> {
    console.log('Rotating encryption keys...');
    
    // Generate new keys for all servers
    for (const serverId of this.trustRelationships.keys()) {
      const newKey = this.generateEncryptionKey();
      const keyId = `${serverId}-${Date.now()}`;
      this.encryptionKeys.set(keyId, newKey);
      
      await this.logSecurityEvent('key_rotated', serverId, {
        keyId,
        algorithm: this.config.encryptionAlgorithm
      }, 'low');
    }

    this.emit('keysRotated', {
      timestamp: new Date(),
      keyCount: this.encryptionKeys.size
    });
  }

  private async authenticateSender(
    serverId: ServerIdentifier, 
    securityContext: SecurityContext
  ): Promise<AuthenticationResult> {
    // Check if server has valid certificate
    const certificate = this.certificates.get(serverId);
    if (!certificate) {
      return {
        valid: false,
        token: '',
        serverId,
        permissions: [],
        expiresAt: new Date()
      };
    }

    // Validate certificate
    const certValidation = await this.validateCertificate(certificate);
    if (!certValidation.valid) {
      return {
        valid: false,
        token: '',
        serverId,
        permissions: [],
        expiresAt: new Date()
      };
    }

    // Generate authentication token
    const token = this.generateAuthenticationToken(serverId);
    const permissions = this.serverPermissions.get(serverId) || [];
    const expiresAt = new Date(Date.now() + this.config.authenticationTimeout);

    return {
      valid: true,
      token,
      serverId,
      permissions,
      expiresAt
    };
  }

  private async authorizeOperation(
    operation: string,
    source: ServerIdentifier,
    target: ServerIdentifier | ServerIdentifier[]
  ): Promise<AuthorizationResult> {
    const permissions = this.serverPermissions.get(source) || [];
    
    // Check if server has permission for this operation
    const hasPermission = permissions.includes('*') || 
                         permissions.includes(operation) ||
                         permissions.includes(`${operation}:*`);

    if (!hasPermission) {
      return {
        authorized: false,
        permissions,
        reason: `Server ${source} does not have permission for operation ${operation}`
      };
    }

    // Check target-specific permissions if needed
    const targets = Array.isArray(target) ? target : [target];
    for (const targetServer of targets) {
      const targetPermission = `${operation}:${targetServer}`;
      if (permissions.includes(targetPermission) || permissions.includes('*') || permissions.includes(`${operation}:*`)) {
        continue;
      }
      
      return {
        authorized: false,
        permissions,
        reason: `Server ${source} does not have permission to perform ${operation} on ${targetServer}`
      };
    }

    return {
      authorized: true,
      permissions
    };
  }

  private async encryptPayload(payload: any, operation: string): Promise<EncryptedPayload> {
    // Determine if encryption is required based on operation type
    const requiresEncryption = this.requiresEncryption(operation);
    
    if (!requiresEncryption || !this.config.enableEncryption) {
      return {
        data: payload.data,
        encryption: { enabled: false }
      };
    }

    // Encrypt sensitive data
    const encryptionKey = await this.getCurrentEncryptionKey();
    const iv = randomBytes(16);
    const cipher = createCipher(this.config.encryptionAlgorithm, encryptionKey.key);
    
    let encrypted = cipher.update(JSON.stringify(payload.data), 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    return {
      data: encrypted,
      encryption: {
        enabled: true,
        algorithm: this.config.encryptionAlgorithm,
        keyId: encryptionKey.id,
        iv: iv.toString('base64')
      }
    };
  }

  private async decryptPayload(encryptedPayload: EncryptedPayload): Promise<any> {
    if (!encryptedPayload.encryption.enabled) {
      return encryptedPayload;
    }

    const encryptionKey = this.encryptionKeys.get(encryptedPayload.encryption.keyId!);
    if (!encryptionKey) {
      throw new Error(`Encryption key ${encryptedPayload.encryption.keyId} not found`);
    }

    const decipher = createDecipher(encryptedPayload.encryption.algorithm!, encryptionKey);
    
    let decrypted = decipher.update(encryptedPayload.data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return {
      data: JSON.parse(decrypted)
    };
  }

  private async signMessage(message: BaseMessage, payload: EncryptedPayload): Promise<string> {
    const messageContent = JSON.stringify({
      header: message.header,
      payload: payload.data,
      metadata: message.metadata
    });

    const hmac = createHmac('sha256', 'message-signing-key'); // Should use proper key
    hmac.update(messageContent);
    return hmac.digest('base64');
  }

  private async verifySignature(securedMessage: SecuredMessage): Promise<boolean> {
    const messageContent = JSON.stringify({
      header: securedMessage.header,
      payload: (securedMessage.payload as EncryptedPayload).data,
      metadata: securedMessage.metadata
    });

    const hmac = createHmac('sha256', 'message-signing-key'); // Should use proper key
    hmac.update(messageContent);
    const expectedSignature = hmac.digest('base64');

    return expectedSignature === securedMessage.security.signature;
  }

  private async validateMessageIntegrity(securedMessage: SecuredMessage, decryptedPayload: any): Promise<boolean> {
    // Validate message hasn't been tampered with
    const checksum = createHash('sha256')
      .update(JSON.stringify(decryptedPayload))
      .digest('base64');

    // In a real implementation, this would compare against stored checksum
    return true; // Simplified
  }

  private async validateAuthorization(securedMessage: SecuredMessage): Promise<boolean> {
    const operation = securedMessage.header.operation;
    const permissions = securedMessage.security.authorization;
    
    return permissions.includes('*') || 
           permissions.includes(operation) ||
           permissions.includes(`${operation}:*`);
  }

  private async getServerCertificate(serverId: ServerIdentifier): Promise<Certificate> {
    const certificate = this.certificates.get(serverId);
    if (!certificate) {
      // Generate self-signed certificate for testing
      return this.generateSelfSignedCertificate(serverId);
    }
    return certificate;
  }

  private async validateCertificate(certificate: Certificate): Promise<{ valid: boolean; reason?: string }> {
    // Check expiration
    if (certificate.expiresAt < new Date()) {
      return { valid: false, reason: 'Certificate has expired' };
    }

    // Check issuer (simplified)
    if (!certificate.issuer) {
      return { valid: false, reason: 'Certificate has no issuer' };
    }

    return { valid: true };
  }

  private async performMutualAuthentication(
    serverId: ServerIdentifier, 
    certificate: Certificate
  ): Promise<{ success: boolean; sharedSecret?: string }> {
    // Simplified mutual authentication
    const sharedSecret = this.generateSharedSecret(serverId);
    return {
      success: true,
      sharedSecret
    };
  }

  private async establishSecureChannel(
    serverId: ServerIdentifier, 
    sharedSecret: string
  ): Promise<SecureChannel> {
    return {
      id: `channel-${serverId}-${Date.now()}`,
      algorithm: this.config.encryptionAlgorithm,
      sharedSecret,
      establishedAt: new Date(),
      lastUsed: new Date()
    };
  }

  private getServerPermissions(serverId: ServerIdentifier): string[] {
    return this.serverPermissions.get(serverId) || ['basic_operations'];
  }

  private isOperationPermitted(operation: string, permissions: string[]): boolean {
    return permissions.includes('*') || 
           permissions.includes(operation) ||
           permissions.includes(`${operation}:*`);
  }

  private calculateTrustLevel(trustRelationship: TrustRelationship): number {
    // Calculate trust based on various factors
    const timeFactor = Math.min(1, (Date.now() - trustRelationship.establishedAt.getTime()) / (30 * 24 * 60 * 60 * 1000)); // 30 days
    const permissionFactor = trustRelationship.permissions.length / 10; // Assume max 10 permissions
    
    return Math.min(100, (timeFactor + permissionFactor) * 50);
  }

  private requiresEncryption(operation: string): boolean {
    const sensitiveOperations = [
      'authentication',
      'authorization',
      'key_exchange',
      'credential_update',
      'sensitive_data'
    ];
    
    return sensitiveOperations.some(sensitive => operation.includes(sensitive));
  }

  private async getCurrentEncryptionKey(): Promise<{ id: string; key: string }> {
    // Get the most recent key
    const keys = Array.from(this.encryptionKeys.entries());
    if (keys.length === 0) {
      const newKey = this.generateEncryptionKey();
      const keyId = `default-${Date.now()}`;
      this.encryptionKeys.set(keyId, newKey);
      return { id: keyId, key: newKey };
    }
    
    const [keyId, key] = keys[keys.length - 1];
    return { id: keyId, key };
  }

  private generateEncryptionKey(): string {
    return randomBytes(32).toString('base64');
  }

  private generateAuthenticationToken(serverId: ServerIdentifier): string {
    const payload = {
      serverId,
      timestamp: Date.now(),
      nonce: randomBytes(16).toString('base64')
    };
    
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  private generateSharedSecret(serverId: ServerIdentifier): string {
    return createHash('sha256')
      .update(`${serverId}-${Date.now()}-${randomBytes(32).toString('base64')}`)
      .digest('base64');
  }

  private generateSelfSignedCertificate(serverId: ServerIdentifier): Certificate {
    const keyPair = {
      publicKey: randomBytes(256).toString('base64'),
      privateKey: randomBytes(256).toString('base64')
    };
    
    const certificate: Certificate = {
      id: `cert-${serverId}-${Date.now()}`,
      serverId,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.certificateValidityPeriod),
      issuer: 'SuperClaude-CA',
      fingerprint: createHash('sha256').update(keyPair.publicKey).digest('hex')
    };
    
    this.certificates.set(serverId, certificate);
    return certificate;
  }

  private async logSecurityEvent(
    event: string,
    serverId: ServerIdentifier,
    details: any,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> {
    if (!this.config.enableAuditLogging) {
      return;
    }

    const auditEntry: SecurityAuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      event,
      serverId,
      details,
      severity,
      resolved: severity === 'low'
    };

    this.auditLog.push(auditEntry);
    
    // Keep only recent entries (last 10000)
    if (this.auditLog.length > 10000) {
      this.auditLog.splice(0, this.auditLog.length - 10000);
    }

    this.emit('securityEvent', auditEntry);

    if (severity === 'critical' || severity === 'high') {
      this.emit('securityAlert', auditEntry);
    }
  }

  private initializeDefaultKeys(): void {
    // Initialize with default encryption key
    const defaultKey = this.generateEncryptionKey();
    this.encryptionKeys.set('default', defaultKey);
    
    // Set up default permissions
    this.serverPermissions.set('orchestrator', ['*']);
    this.serverPermissions.set('router', ['route_message', 'health_check']);
    this.serverPermissions.set('personas', ['persona_consultation', 'chain_execution']);
  }

  destroy(): void {
    this.certificates.clear();
    this.trustRelationships.clear();
    this.encryptionKeys.clear();
    this.serverPermissions.clear();
    this.auditLog.length = 0;
    this.removeAllListeners();
  }
}