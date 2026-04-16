interface Props {
  saving: boolean;
  dirty: boolean;
  error: string | null;
}

function SaveIndicator({ saving, dirty, error }: Props) {
  let label = 'Saved';
  let className = 'text-muted';
  if (error) {
    label = `Save failed: ${error}`;
    className = 'text-danger';
  } else if (saving) {
    label = 'Saving…';
  } else if (dirty) {
    label = 'Unsaved changes';
    className = 'text-warning';
  }
  return <span className={`small ${className}`}>{label}</span>;
}

export default SaveIndicator;
