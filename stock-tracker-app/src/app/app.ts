import { Component, OnInit, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, DOCUMENT, CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { FormsModule } from '@angular/forms';
import { User } from '@angular/fire/auth';
import { AuthService } from './services';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MenubarModule,
    ToggleSwitchModule,
    ButtonModule,
    AvatarModule,
    MenuModule,
    FormsModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private authService = inject(AuthService);

  title = 'Stock Tracker';
  darkMode = true;
  user: User | null = null;
  userMenuItems: MenuItem[] = [];

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('darkMode');
      this.darkMode = savedTheme === null ? true : savedTheme === 'true';
      this.applyTheme();
    }

    this.authService.user$.subscribe(user => {
      this.user = user;
      this.userMenuItems = [
        {
          label: user?.displayName || 'User',
          items: [
            {
              label: 'Sign Out',
              icon: 'pi pi-sign-out',
              command: () => this.signOut()
            }
          ]
        }
      ];
    });
  }

  async signIn(): Promise<void> {
    try {
      await this.authService.signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.authService.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', String(this.darkMode));
    this.applyTheme();
  }

  private applyTheme(): void {
    const html = this.document.documentElement;
    const body = this.document.body;
    if (this.darkMode) {
      html.classList.add('dark-theme');
      html.classList.remove('light-theme');
      body.classList.add('dark-theme');
      body.classList.remove('light-theme');
    } else {
      html.classList.add('light-theme');
      html.classList.remove('dark-theme');
      body.classList.add('light-theme');
      body.classList.remove('dark-theme');
    }
  }
}
