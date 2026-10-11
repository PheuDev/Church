// Culte du dimanche — service principal
import { personLabel, name1, F } from './resdefs.js';
import { fmtDate, fmtMoney } from '../lib/format.js';

export const SUNDAY_SERVICE_R = {
  'sunday-services': {
    path: '/sunday-services',
    label: 'Cultes du dimanche',
    singular: 'Culte',
    icon: 'Church',
    searchPlaceholder: 'Thème…',
    columns: [
      { title: 'Date',              render: (r) => fmtDate(r.serviceDate), sortKey: 'serviceDate' },
      { title: 'MC',                render: (r) => (r.mc ? `${r.mc.firstName} ${r.mc.lastName}` : '—') },
      { title: 'Prédicateur',       render: (r) => (r.preacher ? `${r.preacher.firstName} ${r.preacher.lastName}` : '—') },
      { title: 'Thème',             render: (r) => r.theme || '—' },
      { title: 'Offrande',          render: (r) => fmtMoney(r.offering ?? 0) },
      { title: 'Offrande spéciale', render: (r) => (Number(r.specialOffering) > 0 ? fmtMoney(r.specialOffering) : '—') },
    ],
    filters: [
      { name: 'preacherId', label: 'Prédicateur', source: '/persons', optionLabel: personLabel },
      { name: 'mcPersonId', label: 'MC', source: '/persons', optionLabel: personLabel },
    ],
    form: [
      { name: 'serviceDate',  label: 'Date du culte', type: 'date', required: true },
      { name: 'mcPersonId',   label: 'Maître de cérémonie', type: 'async', source: '/persons', optionLabel: personLabel,
        hint: 'Sélectionner dans l\'annuaire.' },
      { name: 'preacherId',   label: 'Prédicateur', type: 'async', source: '/persons', optionLabel: personLabel,
        hint: 'Par défaut le pasteur — modifiable.' },
      { name: 'theme',        label: 'Thème / texte', type: 'text', full: true },
      { name: 'offering',     label: 'Offrande normale (F CFA)', type: 'number', min: 0, step: 'any' },
      { name: 'specialOffering', label: 'Offrande spéciale (F CFA)', type: 'number', min: 0, step: 'any',
        hint: 'À renseigner si le dimanche coïncide avec un événement.' },
      { name: 'eventId',      label: 'Événement associé (optionnel)', type: 'async', source: '/events', optionLabel: name1 },
      F.notes('Notes'),
    ],
  },
};
