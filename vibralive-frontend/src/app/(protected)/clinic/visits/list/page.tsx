import { VisitsListView } from '../components/visits-list-view';

export const metadata = {
  title: 'Visitas - Lista | Groober',
};

export default function VisitsListPage() {
  return <VisitsListView showCalendarToggle={true} />;
}
