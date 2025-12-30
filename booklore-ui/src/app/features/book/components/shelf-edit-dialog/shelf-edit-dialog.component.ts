import {Component, inject, OnInit} from '@angular/core';
import {ShelfService} from '../../service/shelf.service';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {Button} from 'primeng/button';
import {InputText} from 'primeng/inputtext';

import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Shelf} from '../../model/shelf.model';
import {MessageService} from 'primeng/api';
import {IconPickerService, IconSelection} from '../../../../shared/service/icon-picker.service';
import {IconDisplayComponent} from '../../../../shared/components/icon-display/icon-display.component';
import {EmailV2ProviderService} from '../../../settings/email-v2/email-v2-provider/email-v2-provider.service';
import {EmailV2RecipientService} from '../../../settings/email-v2/email-v2-recipient/email-v2-recipient.service';
import {EmailProvider} from '../../../settings/email-v2/email-provider.model';
import {EmailRecipient} from '../../../settings/email-v2/email-recipient.model';
import {Select} from 'primeng/select';
import {ToggleSwitchModule} from 'primeng/toggleswitch';

@Component({
  selector: 'app-shelf-edit-dialog',
  imports: [
    Button,
    InputText,
    ReactiveFormsModule,
    FormsModule,
    IconDisplayComponent,
    Select,
    ToggleSwitchModule
  ],
  templateUrl: './shelf-edit-dialog.component.html',
  standalone: true,
  styleUrl: './shelf-edit-dialog.component.scss'
})
export class ShelfEditDialogComponent implements OnInit {

  private shelfService = inject(ShelfService);
  private dynamicDialogConfig = inject(DynamicDialogConfig);
  private dynamicDialogRef = inject(DynamicDialogRef);
  private messageService = inject(MessageService);
  private iconPickerService = inject(IconPickerService);
  private emailProviderService = inject(EmailV2ProviderService);
  private emailRecipientService = inject(EmailV2RecipientService);

  shelfName: string = '';
  selectedIcon: IconSelection | null = null;
  shelf!: Shelf | undefined;
  autoEmailEnabled = false;
  emailProviders: { label: string; value: EmailProvider }[] = [];
  emailRecipients: { label: string; value: EmailRecipient }[] = [];
  selectedProvider: { label: string; value: EmailProvider } | null = null;
  selectedRecipient: { label: string; value: EmailRecipient } | null = null;

  ngOnInit(): void {
    const shelfId = this.dynamicDialogConfig?.data.shelfId;
    this.shelf = this.shelfService.getShelfById(shelfId);
    if (this.shelf) {
      this.shelfName = this.shelf.name;
      this.autoEmailEnabled = this.shelf.autoEmailEnabled ?? false;
      if (this.shelf.iconType === 'PRIME_NG') {
        this.selectedIcon = {type: 'PRIME_NG', value: `pi pi-${this.shelf.icon}`};
      } else {
        this.selectedIcon = {type: 'CUSTOM_SVG', value: this.shelf.icon};
      }
    }

    this.emailProviderService.getEmailProviders().subscribe({
      next: (emailProviders: EmailProvider[]) => {
        this.emailProviders = emailProviders.map(provider => ({
          label: `${provider.name} | ${provider.fromAddress || provider.host}`,
          value: provider
        }));
        if (this.shelf?.autoEmailProviderId) {
          this.selectedProvider = this.emailProviders.find(provider => provider.value.id === this.shelf?.autoEmailProviderId) ?? null;
        }
      }
    });

    this.emailRecipientService.getRecipients().subscribe({
      next: (emailRecipients: EmailRecipient[]) => {
        this.emailRecipients = emailRecipients.map(recipient => ({
          label: `${recipient.name} | ${recipient.email}`,
          value: recipient
        }));
        if (this.shelf?.autoEmailRecipientId) {
          this.selectedRecipient = this.emailRecipients.find(recipient => recipient.value.id === this.shelf?.autoEmailRecipientId) ?? null;
        }
      }
    });
  }

  openIconPicker() {
    this.iconPickerService.open().subscribe(icon => {
      if (icon) {
        this.selectedIcon = icon;
      }
    })
  }

  clearSelectedIcon() {
    this.selectedIcon = null;
  }

  onAutoEmailToggle(enabled: boolean): void {
    if (!enabled) {
      this.selectedProvider = null;
      this.selectedRecipient = null;
    }
  }

  save() {
    const iconValue = this.selectedIcon?.value || 'bookmark';
    const iconType = this.selectedIcon?.type || 'PRIME_NG';

    const shelf: Shelf = {
      name: this.shelfName,
      icon: iconValue,
      iconType: iconType,
      autoEmailEnabled: this.autoEmailEnabled,
      autoEmailProviderId: this.selectedProvider?.value?.id,
      autoEmailRecipientId: this.selectedRecipient?.value?.id
    };

    this.shelfService.updateShelf(shelf, this.shelf?.id).subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'Shelf Updated', detail: 'The shelf was updated successfully.'});
        this.dynamicDialogRef.close();
      },
      error: (e) => {
        this.messageService.add({severity: 'error', summary: 'Update Failed', detail: 'An error occurred while updating the shelf. Please try again.'});
        console.error(e);
      }
    });
  }

  closeDialog() {
    this.dynamicDialogRef.close();
  }
}
