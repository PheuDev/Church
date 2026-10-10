// Activités — configuration des ressources
import { BadgeEnum } from '../components/ui.jsx';
import { personLabel, name1, F } from './resdefs.js';
import { fmtDate } from '../lib/format.js';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';

export const ACTIVITIES_R = {
  activities: {
    path: '/activities',
    label: 'Activités',
    singular: 'Activité',
    icon: 'CalendarDays',
    searchPlaceholder: 'Titre, lieu…',
    columns: [
      { title: 'Titre', render: (r) => <b>{r.title}</b> },
      { title: 'Type', render: (r) => name1(r.type) },
      { title: 'Date', render: (r) => fmtDate(r.activityDate) },
      { title: 'Heures', render: (r) => (r.startTime ? `${r.startTime}–${r.endTime || '?'}` : '—') },
      { title: 'Présents', render: (r) => (r.attendanceStats?.[0] ? <b>{r.attendanceStats[0].presentCount}</b> : '—') },
      { title: 'Statut', render: (r) => <BadgeEnum group="ActivityStatus" value={r.status} /> },
      { title: 'Responsable', render: (r) => (r.responsible ? `${r.responsible.firstName} ${r.responsible.lastName}` : '—') },
    ],
    filters: [
      { name: 'typeId', label: 'Type', source: '/activity-types', optionLabel: name1 },
      { name: 'status', label: 'Statut', options: 'ActivityStatus' },
    ],
    form: [
      { name: 'typeId', label: "Type d'activité", type: 'async', source: '/activity-types', optionLabel: name1, required: true },
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'activityDate', label: 'Date', type: 'date', required: true },
      { name: 'startTime', label: 'Début (HH:MM)', type: 'time' },
      { name: 'endTime', label: 'Fin (HH:MM)', type: 'time' },
      { name: 'location', label: 'Lieu', type: 'text' },
      F.responsible(),
      { name: 'description', label: 'Description', type: 'textarea', full: true },
      { name: 'status', label: 'Statut', type: 'select', options: 'ActivityStatus' },
      { name: 'reportNote', label: 'Rapport', type: 'textarea', full: true },
    ],
    rowActions: (row, { canEdit }) => (
      <>
        {canEdit && (
          <Link className="row-action" to={`/activities/${row.id}/attendance`} title="Saisir les présences">
            <ClipboardList size={16} />
          </Link>
        )}
      </>
    ),
  },
};