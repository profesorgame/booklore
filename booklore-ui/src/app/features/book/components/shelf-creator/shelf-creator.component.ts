import {Component, inject, OnInit} from '@angular/core';
import {DynamicDialogRef} from 'primeng/dynamicdialog';
import {MessageService} from 'primeng/api';
import {ShelfService} from '../../service/shelf.service';
import {IconPickerService, IconSelection} from '../../../../shared/service/icon-picker.service';
import {Shelf} from '../../model/shelf.model';
import {FormsModule} from '@angular/forms';
import {Button} from 'primeng/button';
import {InputText} from 'primeng/inputtext';
import {Tooltip} from 'primeng/tooltip';
import {IconDisplayComponent} from '../../../../shared/components/icon-display/icon-display.component';
import {Select} from 'primeng/select';
import {ToggleSwitchModule} from 'primeng/toggleswitch';
import {EmailV2ProviderService} from '../../../settings/email-v2/email-v2-provider/email-v2-provider.service';
import {EmailV2RecipientService} from '../../../settings/email-v2/email-v2-recipient/email-v2-recipient.service';
import {EmailProvider} from '../../../settings/email-v2/email-provider.model';
import {EmailRecipient} from '../../../settings/email-v2/email-recipient.model';

@Component({
  selector: 'app-shelf-creator',
  standalone: true,
  templateUrl: './shelf-creator.component.html',
  imports: [
    FormsModule,
    Button,
    InputText,
    Tooltip,
    IconDisplayComponent,
    Select,
    ToggleSwitchModule
  ],
  styleUrl: './shelf-creator.component.scss',
})
export class ShelfCreatorComponent implements OnInit {
  private shelfService = inject(ShelfService);
  private dynamicDialogRef = inject(DynamicDialogRef);
  private messageService = inject(MessageService);
  private iconPickerService = inject(IconPickerService);
  private emailProviderService = inject(EmailV2ProviderService);
  private emailRecipientService = inject(EmailV2RecipientService);

  shelfName: string = '';
  selectedIcon: IconSelection | null = null;
  autoEmailEnabled = false;
  emailProviders: { label: string; value: EmailProvider }[] = [];
  emailRecipients: { label: string; value: EmailRecipient }[] = [];
  selectedProvider: { label: string; value: EmailProvider } | null = null;
  selectedRecipient: { label: string; value: EmailRecipient } | null = null;

  ngOnInit(): void {
    this.emailProviderService.getEmailProviders().subscribe({
      next: (emailProviders: EmailProvider[]) => {
        this.emailProviders = emailProviders.map(provider => ({
          label: `${provider.name} | ${provider.fromAddress || provider.host}`,
          value: provider
        }));
      }
    });

    this.emailRecipientService.getRecipients().subscribe({
      next: (emailRecipients: EmailRecipient[]) => {
        this.emailRecipients = emailRecipients.map(recipient => ({
          label: `${recipient.name} | ${recipient.email}`,
          value: recipient
        }));
      }
    });
  }

  openIconPicker(): void {
    this.iconPickerService.open().subscribe(icon => {
      if (icon) {
        this.selectedIcon = icon;
      }
    });
  }

  clearSelectedIcon(): void {
    this.selectedIcon = null;
  }

  cancel(): void {
    this.dynamicDialogRef.close();
  }

  onAutoEmailToggle(enabled: boolean): void {
    if (!enabled) {
      this.selectedProvider = null;
      this.selectedRecipient = null;
    }
  }

  createShelf(): void {
    const iconValue = this.selectedIcon?.value || 'bookmark';
    const iconType = this.selectedIcon?.type || 'PRIME_NG';

    const newShelf: Partial<Shelf> = {
      name: this.shelfName,
      icon: iconValue,
      iconType: iconType,
      autoEmailEnabled: this.autoEmailEnabled,
      autoEmailProviderId: this.selectedProvider?.value?.id,
      autoEmailRecipientId: this.selectedRecipient?.value?.id
    };

    this.shelfService.createShelf(newShelf as Shelf).subscribe({
      next: () => {
        this.messageService.add({severity: 'info', summary: 'Success', detail: `Shelf created: ${this.shelfName}`});
        this.dynamicDialogRef.close(true);
      },
      error: (e) => {
        this.messageService.add({severity: 'error', summary: 'Error', detail: 'Failed to create shelf'});
        console.error('Error creating shelf:', e);
      }
    });
  }
}
