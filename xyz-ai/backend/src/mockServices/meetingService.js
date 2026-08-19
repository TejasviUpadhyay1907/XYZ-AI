/**
 * Meeting/Scheduling Service (Mock)
 * Handles meeting requests between parents and teachers.
 */

const meetings = [];
let meetingCounter = 1;

class MeetingService {
  /**
   * Request a meeting
   */
  static requestMeeting({ requestedBy, requestedByName, requestedWith, requestedWithName, purpose, preferredDate, preferredTime }) {
    const meeting = {
      id: `MTG-${String(meetingCounter++).padStart(4, '0')}`,
      requestedBy,
      requestedByName,
      requestedWith,
      requestedWithName,
      purpose,
      preferredDate: preferredDate || null,
      preferredTime: preferredTime || null,
      status: 'requested',
      createdAt: new Date().toISOString(),
      confirmedAt: null,
      notes: null
    };
    meetings.push(meeting);
    return meeting;
  }

  /**
   * Get meetings for a user (either requester or requested)
   */
  static getMeetingsForUser(userId) {
    return meetings.filter(m => m.requestedBy === userId || m.requestedWith === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Confirm/reject a meeting
   */
  static updateMeetingStatus(meetingId, status, notes = null) {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return null;
    meeting.status = status;
    meeting.confirmedAt = new Date().toISOString();
    meeting.notes = notes;
    return meeting;
  }

  /**
   * Get all meetings (for principal)
   */
  static getAllMeetings() {
    return meetings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

module.exports = MeetingService;
