import type { Errors } from '../types/article';

interface Props {
  errors: Errors | null | undefined;
}

export default function ListErrors({ errors }: Props) {
  if (!errors) return null;

  return (
    <ul className="error-messages">
      {Object.entries(errors).map(([field, messages]) =>
        (messages as string[]).map((message) => (
          <li key={`${field}-${message}`}>
            {field} {message}
          </li>
        )),
      )}
    </ul>
  );
}
