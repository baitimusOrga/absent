import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  // PDF Animation
  isPdfAnimating = false;
  showStamp = false;
  animatedName = '';
  animatedClass = '';
  animatedDate = '';
  animatedLessons = '';
  animatedReason = '';
  private animationTimeout: any;
  private stampTimeout: any;

  // Features
  highlightedFeature: number | null = null;
  autoFillFields = [
    { label: 'Name', value: 'Max Mustermann' },
    { label: 'Klasse', value: 'INF22a' },
    { label: 'Lehrfirma', value: 'Tech AG' },
    { label: 'Berufsbildner', value: 'Hans Meier' }
  ];

  // Steps
  activeStep = 0;
  steps = [
    {
      title: 'Kalender verbinden',
      description: 'Kopiere deine Schulnetz-Kalender URL und füge sie in dein Profil ein.'
    },
    {
      title: 'Datum auswählen',
      description: 'Wähle das Datum aus, an dem du gefehlt hast oder fehlen wirst.'
    },
    {
      title: 'PDF herunterladen',
      description: 'Dein fertig ausgefülltes Formular steht sofort zum Download bereit.'
    }
  ];

  ngOnInit() {
    // Start initial animation after a delay
    setTimeout(() => this.startPdfAnimation(), 1500);
  }

  ngOnDestroy() {
    this.clearAnimationTimeouts();
  }

  private clearAnimationTimeouts() {
    if (this.animationTimeout) clearTimeout(this.animationTimeout);
    if (this.stampTimeout) clearTimeout(this.stampTimeout);
  }

  startPdfAnimation() {
    this.clearAnimationTimeouts();
    this.isPdfAnimating = true;
    this.showStamp = false;
    
    // Simulate typing animation
    this.typeText('animatedName', 'Max Mustermann', 50);
    setTimeout(() => this.typeText('animatedClass', 'INF22a', 50), 300);
    setTimeout(() => this.typeText('animatedDate', '15.01.2025', 50), 600);
    setTimeout(() => this.typeText('animatedLessons', 'M242 (08:00-11:30)', 40), 900);
    setTimeout(() => this.typeText('animatedReason', 'Arzttermin', 50), 1200);
    
    this.stampTimeout = setTimeout(() => {
      this.showStamp = true;
    }, 2000);
  }

  stopPdfAnimation() {
    // Keep the filled state visible
  }

  private typeText(field: 'animatedName' | 'animatedClass' | 'animatedDate' | 'animatedLessons' | 'animatedReason', text: string, speed: number) {
    let i = 0;
    this[field] = '';
    const type = () => {
      if (i < text.length) {
        this[field] += text.charAt(i);
        i++;
        this.animationTimeout = setTimeout(type, speed);
      }
    };
    type();
  }

  highlightFeature(index: number) {
    this.highlightedFeature = index;
  }

  setActiveStep(index: number) {
    this.activeStep = index;
  }
}
