import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { WorkbookSubmission, WorkbookBook, OvercomerChallenge } from '../src/types/workbook';
import {
  OVERCOMER_CHALLENGES,
  OVERCOMER_FOUNDER_NOTE,
  OVERCOMER_CLOSING_NOTE
} from '../src/content/overcomerWorkbookData';

const SUBMISSIONS_FILE = path.join(process.cwd(), 'data', 'workbook_submissions.json');
const WORKBOOKS_FILE = path.join(process.cwd(), 'data', 'workbooks.json');

export class WorkbookService {
  private submissions: Map<string, WorkbookSubmission> = new Map();
  private books: Map<string, WorkbookBook> = new Map();

  constructor() {
    this.loadBooks();
    this.loadSubmissions();
  }

  private loadBooks() {
    try {
      if (fs.existsSync(WORKBOOKS_FILE)) {
        const raw = fs.readFileSync(WORKBOOKS_FILE, 'utf-8');
        const list: WorkbookBook[] = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          list.forEach((b) => this.books.set(b.id, b));
          return;
        }
      }
    } catch (e) {
      console.warn('[WorkbookService] Could not read workbooks file:', e);
    }

    // Default Seed: The Overcomer Workbook
    const defaultOvercomerBook: WorkbookBook = {
      id: 'overcomer',
      title: 'The Overcomer Workbook',
      subtitle: 'RU Recovery Foundational Curriculum',
      author: 'Steven Curington (1965-2010)',
      coverImage: '/courses/overcomer_cover.jpg',
      badgeEarned: 'Overcomer Graduate & RU John/Romans',
      description: 'The complete original foundational curriculum of RU Recovery. 15 challenges covering prayer, scripture memorization, attendance, Proverbs meditations, and witnessing.',
      category: 'RU Recovery',
      level: 'Foundational',
      challenges: OVERCOMER_CHALLENGES,
      founderNote: OVERCOMER_FOUNDER_NOTE,
      closingNote: OVERCOMER_CLOSING_NOTE,
      isDefault: true,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: new Date().toISOString()
    };

    this.books.set(defaultOvercomerBook.id, defaultOvercomerBook);
    this.saveBooks();
  }

  private saveBooks() {
    try {
      const dir = path.dirname(WORKBOOKS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const array = Array.from(this.books.values());
      fs.writeFileSync(WORKBOOKS_FILE, JSON.stringify(array, null, 2), 'utf-8');
    } catch (e) {
      console.error('[WorkbookService] Could not save workbooks:', e);
    }
  }

  public getWorkbooks(): WorkbookBook[] {
    return Array.from(this.books.values());
  }

  public getWorkbookById(id: string): WorkbookBook | undefined {
    return this.books.get(id);
  }

  public createWorkbook(data: Partial<WorkbookBook> & { title: string }): WorkbookBook {
    const id = data.id || `book_${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const newBook: WorkbookBook = {
      id,
      title: data.title,
      subtitle: data.subtitle || 'RU Discipleship Curriculum',
      author: data.author || 'RU Recovery Leadership',
      coverImage: data.coverImage || '',
      badgeEarned: data.badgeEarned || 'Course Completion Award',
      description: data.description || '',
      category: data.category || 'RU Recovery',
      level: data.level || 'Intermediate',
      challenges: data.challenges && data.challenges.length > 0 ? data.challenges : [],
      founderNote: data.founderNote,
      closingNote: data.closingNote,
      mediaUrl: data.mediaUrl,
      isDefault: false,
      createdAt: now,
      updatedAt: now
    };

    this.books.set(newBook.id, newBook);
    this.saveBooks();
    return newBook;
  }

  public updateWorkbook(id: string, updates: Partial<WorkbookBook>): WorkbookBook | null {
    const book = this.books.get(id);
    if (!book) return null;

    const updated: WorkbookBook = {
      ...book,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.books.set(id, updated);
    this.saveBooks();
    return updated;
  }

  public deleteWorkbook(id: string): boolean {
    if (id === 'overcomer') return false; // Protect original Overcomer
    const deleted = this.books.delete(id);
    if (deleted) this.saveBooks();
    return deleted;
  }

  public addChallengeToWorkbook(workbookId: string, challengeData: Partial<OvercomerChallenge>): OvercomerChallenge | null {
    const book = this.books.get(workbookId);
    if (!book) return null;

    const nextId = (book.challenges.reduce((max, c) => Math.max(max, c.id), 0) || 0) + 1;
    const newChallenge: OvercomerChallenge = {
      id: challengeData.id || nextId,
      title: challengeData.title || `Challenge ${nextId}: Custom Challenge`,
      subtitle: challengeData.subtitle,
      category: challengeData.category || 'study',
      badgeEarned: challengeData.badgeEarned,
      scripture: challengeData.scripture,
      instructions: challengeData.instructions || 'Read, meditate, and write your responses.',
      formFields: challengeData.formFields || [
        {
          id: `c${nextId}_reflection`,
          label: 'Personal Reflection:',
          type: 'textarea',
          placeholder: 'Write your notes and reflections here...'
        }
      ]
    };

    book.challenges.push(newChallenge);
    book.updatedAt = new Date().toISOString();
    this.saveBooks();
    return newChallenge;
  }

  public updateChallengeInWorkbook(
    workbookId: string,
    challengeId: number,
    updates: Partial<OvercomerChallenge>
  ): OvercomerChallenge | null {
    const book = this.books.get(workbookId);
    if (!book) return null;

    const idx = book.challenges.findIndex((c) => c.id === challengeId);
    if (idx === -1) return null;

    book.challenges[idx] = {
      ...book.challenges[idx],
      ...updates,
      id: challengeId // preserve ID
    };

    book.updatedAt = new Date().toISOString();
    this.saveBooks();
    return book.challenges[idx];
  }

  public deleteChallengeFromWorkbook(workbookId: string, challengeId: number): boolean {
    const book = this.books.get(workbookId);
    if (!book) return false;

    const beforeLen = book.challenges.length;
    book.challenges = book.challenges.filter((c) => c.id !== challengeId);
    if (book.challenges.length !== beforeLen) {
      book.updatedAt = new Date().toISOString();
      this.saveBooks();
      return true;
    }
    return false;
  }

  private loadSubmissions() {
    try {
      if (fs.existsSync(SUBMISSIONS_FILE)) {
        const raw = fs.readFileSync(SUBMISSIONS_FILE, 'utf-8');
        const list: WorkbookSubmission[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((sub) => {
            this.submissions.set(sub.id, sub);
          });
        }
      }
    } catch (e) {
      console.warn('[WorkbookService] Could not load submissions file:', e);
    }
  }

  private saveSubmissions() {
    try {
      const dir = path.dirname(SUBMISSIONS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const array = Array.from(this.submissions.values());
      fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(array, null, 2), 'utf-8');
    } catch (e) {
      console.error('[WorkbookService] Could not save submissions:', e);
    }
  }

  public saveSubmission(
    userId: string,
    userName: string,
    challengeId: number,
    answers: Record<string, string>,
    studentSignature?: string,
    userAvatar?: string,
    workbookId: string = 'overcomer'
  ): WorkbookSubmission {
    // Find existing submission for this user, challenge, and workbook
    let existing = Array.from(this.submissions.values()).find(
      (s) => s.userId === userId && s.challengeId === challengeId && (s.workbookId || 'overcomer') === workbookId
    );

    const now = new Date().toISOString();

    if (existing) {
      existing.answers = { ...existing.answers, ...answers };
      existing.userName = userName || existing.userName;
      if (userAvatar) existing.userAvatar = userAvatar;
      if (studentSignature) {
        existing.studentSignature = studentSignature;
        existing.studentSignedDate = existing.studentSignedDate || now;
        existing.status = existing.grade ? 'graded' : 'submitted';
      }
      existing.updatedAt = now;
      this.saveSubmissions();
      return existing;
    }

    const newSub: WorkbookSubmission = {
      id: `sub_${randomUUID()}`,
      workbookId,
      userId,
      userName: userName || 'Student',
      userAvatar,
      challengeId,
      answers,
      studentSignature,
      studentSignedDate: studentSignature ? now : undefined,
      status: studentSignature ? 'submitted' : 'draft',
      submittedAt: now,
      updatedAt: now,
    };

    this.submissions.set(newSub.id, newSub);
    this.saveSubmissions();
    return newSub;
  }

  public gradeSubmission(
    submissionId: string,
    grade: 'approved' | 'needs_revision' | 'exceptional',
    teacherFeedback: string,
    teacherId: string,
    teacherName: string,
    teacherSignature: string
  ): WorkbookSubmission | null {
    const sub = this.submissions.get(submissionId);
    if (!sub) return null;

    const now = new Date().toISOString();
    sub.grade = grade;
    sub.teacherFeedback = teacherFeedback;
    sub.gradedBy = teacherId;
    sub.gradedByName = teacherName;
    sub.teacherSignature = teacherSignature;
    sub.teacherSignedDate = now;
    sub.status = 'graded';
    sub.updatedAt = now;

    this.saveSubmissions();
    return sub;
  }

  public getUserSubmissions(userId: string, workbookId?: string): WorkbookSubmission[] {
    return Array.from(this.submissions.values()).filter(
      (s) =>
        (s.userId === userId || (userId === 'user_tex' && s.userName === 'Tex')) &&
        (!workbookId || (s.workbookId || 'overcomer') === workbookId)
    );
  }

  public getAllSubmissions(workbookId?: string): WorkbookSubmission[] {
    return Array.from(this.submissions.values())
      .filter((s) => !workbookId || (s.workbookId || 'overcomer') === workbookId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getSubmissionById(id: string): WorkbookSubmission | undefined {
    return this.submissions.get(id);
  }
}

export const workbookService = new WorkbookService();
