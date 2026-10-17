import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { DonationRecord, GivingConfig } from '../src/types/workbook';

const DONATIONS_FILE = path.join(process.cwd(), 'data', 'donations.json');
const GIVING_CONFIG_FILE = path.join(process.cwd(), 'data', 'giving_config.json');

export class GivingService {
  private donations: DonationRecord[] = [];
  private config: GivingConfig = {
    ministryName: 'Lights Out Baptist Ministry',
    parentCompany: 'Lights Out Holding LLC',
    taxExemptNotice: 'Thank you for your generous kingdom support of Lights Out Baptist Ministry (a ministry of Lights Out Holding LLC). "God loveth a cheerful giver." (2 Cor 9:7)',
    cashAppCashtag: '$LightsOutHoldingLLC',
    squareAppId: 'sandbox-sq0idb-AuraMinistryLive',
    squareLocationId: 'L8J4V9W2G0',
  };

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      if (fs.existsSync(DONATIONS_FILE)) {
        const raw = fs.readFileSync(DONATIONS_FILE, 'utf-8');
        this.donations = JSON.parse(raw);
      }
    } catch (e) {
      this.donations = [];
    }

    try {
      if (fs.existsSync(GIVING_CONFIG_FILE)) {
        const raw = fs.readFileSync(GIVING_CONFIG_FILE, 'utf-8');
        this.config = { ...this.config, ...JSON.parse(raw) };
      }
    } catch (e) {
      // keep defaults
    }
  }

  private saveData() {
    try {
      const dir = path.dirname(DONATIONS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DONATIONS_FILE, JSON.stringify(this.donations, null, 2), 'utf-8');
      fs.writeFileSync(GIVING_CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (e) {
      console.error('[GivingService] Could not save data:', e);
    }
  }

  public getConfig(): GivingConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<GivingConfig>): GivingConfig {
    this.config = { ...this.config, ...newConfig };
    this.saveData();
    return this.config;
  }

  public processDonation(params: {
    donorName: string;
    donorEmail: string;
    amount: number;
    designation: string;
    frequency: 'one_time' | 'monthly';
    paymentMethod: 'square_card' | 'cash_app' | 'apple_pay' | 'google_pay';
    cardLast4?: string;
    cardBrand?: string;
    note?: string;
  }): DonationRecord {
    const txId = `SQ_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const now = new Date().toISOString();

    const record: DonationRecord = {
      id: `don_${randomUUID()}`,
      donorName: params.donorName || 'Anonymous Believer',
      donorEmail: params.donorEmail || 'donor@aura.social',
      amount: Number(params.amount) || 25,
      designation: params.designation || 'Ministry General & App Maintenance',
      frequency: params.frequency || 'one_time',
      paymentMethod: params.paymentMethod || 'square_card',
      transactionId: txId,
      status: 'completed',
      receiptUrl: `/api/donations/receipt/${txId}`,
      createdAt: now,
      note: params.note,
    };

    this.donations.unshift(record);
    this.saveData();
    return record;
  }

  public getDonations(): DonationRecord[] {
    return [...this.donations];
  }

  public getDonationByTxId(txId: string): DonationRecord | undefined {
    return this.donations.find((d) => d.transactionId === txId);
  }
}

export const givingService = new GivingService();
