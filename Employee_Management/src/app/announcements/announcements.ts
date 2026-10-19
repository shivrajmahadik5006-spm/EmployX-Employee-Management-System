import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  AnnouncementService,
  Announcement as ApiAnnouncement
} from '../services/announcement.service';

interface Announcement {
  id: number;
  title: string;
  category: string;
  description: string;
  author: string;
  createdAt: string;
  expiryDate?: string | null;
  isActive: boolean;
}

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './announcements.html',
  styleUrls: ['./announcements.css']
})
export class Announcements implements OnInit {

  // =====================================================
  // USER
  // =====================================================

  isAdmin = false;
  currentUserName = '';

  // =====================================================
  // ANNOUNCEMENTS
  // =====================================================

  announcements: Announcement[] = [];

  // IMPORTANT:
  // This is now a normal property instead of a getter.
  filteredAnnouncements: Announcement[] = [];

  // =====================================================
  // FILTERS
  // =====================================================

  searchText = '';
  selectedCategory = 'All';

  categories: string[] = [
    'General',
    'Holiday',
    'Meeting',
    'Event',
    'Policy',
    'Important'
  ];

  // =====================================================
  // MODAL
  // =====================================================

  showModal = false;
  editingAnnouncement: Announcement | null = null;

  formData: Announcement = {
    id: 0,
    title: '',
    category: 'General',
    description: '',
    author: '',
    createdAt: '',
    expiryDate: null,
    isActive: true
  };

  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private announcementService: AnnouncementService
  ) {}

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    console.log('Announcements page initialized');

    this.loadUser();

    this.loadAnnouncements();
  }

  // =====================================================
  // LOAD CURRENT USER
  // =====================================================

  loadUser(): void {

    const currentUser = localStorage.getItem('currentUser');

    if (!currentUser) {

      console.log('No current user found');

      return;
    }

    try {

      const user = JSON.parse(currentUser);

      const role =
        user.role ||
        user.Role ||
        (
          user.roles &&
          user.roles.length > 0
            ? user.roles[0]
            : ''
        );

      this.isAdmin =
        String(role).toLowerCase() === 'admin';

      this.currentUserName =
        user.name ||
        user.fullName ||
        user.FullName ||
        user.email ||
        'Admin';

      console.log('Current user:', user);

      console.log('Current role:', role);

      console.log('Is admin:', this.isAdmin);

    } catch (error) {

      console.error(
        'Error reading current user:',
        error
      );

    }
  }

  // =====================================================
  // LOAD ANNOUNCEMENTS
  // =====================================================

  loadAnnouncements(): void {

    console.log(
      'Loading announcements from API...'
    );

    this.announcementService
      .getAnnouncements()
      .subscribe({

        next: (data: ApiAnnouncement[]) => {

          console.log(
            'Announcement API response:',
            data
          );

          if (!data) {

            this.announcements = [];

            this.filteredAnnouncements = [];

            return;
          }

          // Convert API data to UI data
          this.announcements = data.map(
            (item: ApiAnnouncement) => {

              return {

                id: item.id,

                title: item.title || '',

                category:
                  item.category || 'General',

                description:
                  item.message || '',

                author:
                  item.createdBy || 'Admin',

                createdAt:
                  item.createdAt,

                expiryDate:
                  item.expiryDate || null,

                isActive:
                  item.isActive

              };

            }
          );

          console.log(
            'Announcements loaded:',
            this.announcements
          );

          console.log(
            'Announcement count:',
            this.announcements.length
          );

          // IMPORTANT
          // Apply filters after API data loads.
          this.applyFilters();

        },

        error: (error) => {

          console.error(
            'Error loading announcements:',
            error
          );

          this.announcements = [];

          this.filteredAnnouncements = [];

        }

      });
  }

  // =====================================================
  // APPLY FILTERS
  // =====================================================

  applyFilters(): void {

    let result = [...this.announcements];

    const search =
      this.searchText
        .trim()
        .toLowerCase();

    // Search filter
    if (search) {

      result = result.filter(item =>

        item.title
          .toLowerCase()
          .includes(search)

        ||

        item.description
          .toLowerCase()
          .includes(search)

        ||

        item.category
          .toLowerCase()
          .includes(search)

        ||

        item.author
          .toLowerCase()
          .includes(search)

      );

    }

    // Category filter
    if (
      this.selectedCategory !== 'All'
    ) {

      result = result.filter(
        item =>
          item.category ===
          this.selectedCategory
      );

    }

    // Store filtered result
    this.filteredAnnouncements = result;

    console.log(
      'Filtered announcements:',
      this.filteredAnnouncements
    );

  }

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  clearFilters(): void {

    this.searchText = '';

    this.selectedCategory = 'All';

    this.applyFilters();

  }

  // =====================================================
  // TRACK BY
  // =====================================================

  trackByAnnouncementId(
    index: number,
    item: Announcement
  ): number {

    return item.id;

  }

  // =====================================================
  // CREATE MODAL
  // =====================================================

  openCreateModal(): void {

    this.editingAnnouncement = null;

    this.formData = {

      id: 0,

      title: '',

      category: 'General',

      description: '',

      author:
        this.currentUserName ||
        'Admin',

      createdAt: '',

      expiryDate: null,

      isActive: true

    };

    this.showModal = true;

  }

  // =====================================================
  // EDIT MODAL
  // =====================================================

  openEditModal(
    announcement: Announcement
  ): void {

    this.editingAnnouncement =
      announcement;

    this.formData = {

      id: announcement.id,

      title: announcement.title,

      category:
        announcement.category,

      description:
        announcement.description,

      author:
        announcement.author,

      createdAt:
        announcement.createdAt,

      expiryDate:
        announcement.expiryDate,

      isActive:
        announcement.isActive

    };

    this.showModal = true;

  }

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  closeModal(): void {

    this.showModal = false;

    this.editingAnnouncement = null;

  }

  // =====================================================
  // SAVE ANNOUNCEMENT
  // =====================================================

  saveAnnouncement(): void {

    // Validate title
    if (
      !this.formData.title.trim()
    ) {

      alert(
        'Please enter announcement title.'
      );

      return;

    }

    // Validate message
    if (
      !this.formData.description.trim()
    ) {

      alert(
        'Please enter announcement message.'
      );

      return;

    }

    const announcement: any = {

      id:
        this.formData.id,

      title:
        this.formData.title.trim(),

      message:
        this.formData.description.trim(),

      category:
        this.formData.category,

      createdAt:
        this.formData.createdAt ||
        new Date().toISOString(),

      expiryDate:
        this.formData.expiryDate ||
        null,

      isActive:
        this.formData.isActive,

      createdBy:
        this.currentUserName ||
        'Admin'

    };

    // =================================================
    // UPDATE
    // =================================================

    if (this.editingAnnouncement) {

      this.announcementService
        .updateAnnouncement(
          this.formData.id,
          announcement
        )
        .subscribe({

          next: () => {

            alert(
              'Announcement updated successfully.'
            );

            this.closeModal();

            this.loadAnnouncements();

          },

          error: (error) => {

            console.error(
              'UPDATE ANNOUNCEMENT ERROR:',
              error
            );

            alert(
              'Failed to update announcement.'
            );

          }

        });

      return;

    }

    // =================================================
    // CREATE
    // =================================================

    this.announcementService
      .createAnnouncement(announcement)
      .subscribe({

        next: (response) => {

          console.log(
            'Announcement created:',
            response
          );

          alert(
            'Announcement created successfully.'
          );

          this.closeModal();

          this.loadAnnouncements();

        },

        error: (error) => {

          console.error(
            'CREATE ANNOUNCEMENT ERROR:',
            error
          );

          alert(
            'Failed to create announcement.'
          );

        }

      });

  }

  // =====================================================
  // DELETE
  // =====================================================

  deleteAnnouncement(
    id: number
  ): void {

    const confirmed = confirm(
      'Are you sure you want to delete this announcement?'
    );

    if (!confirmed) {

      return;

    }

    this.announcementService
      .deleteAnnouncement(id)
      .subscribe({

        next: () => {

          alert(
            'Announcement deleted successfully.'
          );

          this.loadAnnouncements();

        },

        error: (error) => {

          console.error(
            'DELETE ANNOUNCEMENT ERROR:',
            error
          );

          alert(
            'Failed to delete announcement.'
          );

        }

      });

  }

}