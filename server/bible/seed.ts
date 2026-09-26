/**
 * Seed sample LMS courses and lessons
 */

import { BibleStudyDB } from './models';
import { INITIAL_COURSES, INITIAL_LESSONS } from '../../src/content/initialCourses';

export function seedBibleCourses(db: BibleStudyDB): void {
  const existingCourses = db.getAllCourses();

  for (const cData of INITIAL_COURSES) {
    let course = existingCourses.find(
      (c) => c.title.trim().toLowerCase() === cData.title.trim().toLowerCase()
    );

    if (!course) {
      course = db.createCourse(
        cData.title,
        cData.description,
        cData.coverImage,
        cData.category,
        cData.level
      );
    } else {
      // Ensure coverImage and metadata are up to date if currently missing or from temporary uploads
      if (cData.coverImage && (!course.coverImage || course.coverImage.startsWith('/uploads/'))) {
        db.updateCourse(course.id, {
          coverImage: cData.coverImage,
          category: course.category || cData.category,
          level: course.level || cData.level,
        });
        course = db.getCourse(course.id) || course;
      }
    }

    // Now check for initial lessons associated with this course
    const courseLessons = INITIAL_LESSONS.filter(
      (l) => l.courseTitle.trim().toLowerCase() === cData.title.trim().toLowerCase()
    );

    const existingLessons = db.getLessonsByCourse(course.id);

    for (const lData of courseLessons) {
      const existingLesson = existingLessons.find(
        (l) => l.title.trim().toLowerCase() === lData.title.trim().toLowerCase()
      );

      if (!existingLesson) {
        db.createLesson(
          course.id,
          lData.title,
          lData.content,
          lData.scriptureRef,
          lData.quizJson,
          lData.mediaType,
          lData.mediaUrl,
          lData.notes,
          lData.videoPosition || 'top',
          lData.images
        );
      } else {
        // If existing lesson has missing or shorter content/notes, update with the rich version
        const needsContentUpdate = !existingLesson.content?.trim() && Boolean(lData.content?.trim());
        const needsNotesUpdate = !existingLesson.notes?.trim() && Boolean(lData.notes?.trim());
        const needsMediaUpdate = !existingLesson.mediaUrl?.trim() && Boolean(lData.mediaUrl?.trim());

        if (needsContentUpdate || needsNotesUpdate || needsMediaUpdate) {
          db.updateLesson(existingLesson.id, {
            content: existingLesson.content?.trim() || lData.content,
            notes: existingLesson.notes?.trim() || lData.notes,
            mediaUrl: existingLesson.mediaUrl?.trim() || lData.mediaUrl,
            mediaType: existingLesson.mediaType || lData.mediaType,
            videoPosition: existingLesson.videoPosition || lData.videoPosition || 'bottom',
            scriptureRef: existingLesson.scriptureRef || lData.scriptureRef,
          });
        }
      }
    }
  }
}
