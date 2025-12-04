import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-schulnetz-calendar-guide',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './schulnetz-calendar-guide.component.html',
  styleUrl: './schulnetz-calendar-guide.component.css'
})
export class SchulnetzCalendarGuideComponent {
  lightboxImage: string | null = null;
  lightboxAlt: string = '';

  openLightbox(imageSrc: string, alt: string): void {
    this.lightboxImage = imageSrc;
    this.lightboxAlt = alt;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxImage = null;
    this.lightboxAlt = '';
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.lightboxImage) {
      this.closeLightbox();
    }
  }
}
