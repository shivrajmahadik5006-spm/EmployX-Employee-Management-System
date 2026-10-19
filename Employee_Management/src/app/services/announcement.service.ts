import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Announcement {
  id: number;
  title: string;
  message: string;
  category: string;
  createdAt: string;
  expiryDate?: string | null;
  isActive: boolean;
  createdBy?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {

  private apiUrl =
    'https://localhost:7246/api/Announcements';

  constructor(
    private http: HttpClient
  ) {}

  // Get all announcements
  getAnnouncements(): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(
      this.apiUrl
    );
  }

  // Get announcement by ID
  getAnnouncement(
    id: number
  ): Observable<Announcement> {
    return this.http.get<Announcement>(
      `${this.apiUrl}/${id}`
    );
  }

  // Create announcement
  createAnnouncement(
    announcement: Announcement
  ): Observable<Announcement> {
    return this.http.post<Announcement>(
      this.apiUrl,
      announcement
    );
  }

  // Update announcement
  updateAnnouncement(
    id: number,
    announcement: Announcement
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${id}`,
      announcement
    );
  }

  // Delete announcement
  deleteAnnouncement(
    id: number
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }

  // Activate / deactivate announcement
  toggleAnnouncement(
    id: number
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${id}/toggle`,
      {}
    );
  }
}