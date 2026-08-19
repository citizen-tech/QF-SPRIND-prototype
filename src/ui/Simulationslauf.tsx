import { Group, Loader, Paper, Progress, Text, Title } from '@mantine/core';

/**
 * Die Schritte, die der Rechenkern tatsächlich durchläuft. Der Fortschritt ist
 * zeitgesteuert und nicht gemessen — die Rechnung selbst dauert wenige
 * Millisekunden. Die Anzeige benennt deshalb nur, was geschieht, und behauptet
 * keine Dauer.
 */
export const LAUFSCHRITTE = [
  'Vorhaben und Träger angelegt',
  'Beitragende erzeugt, Merkmale zugeordnet',
  'Beiträge auf die Vorhaben verteilt',
  'Bemessungswerte je Vorhaben berechnet',
  'Fördertopf verteilt, Obergrenzen angewandt',
  'Prüfsumme über die Eingangsdaten gebildet',
] as const;

export const LAUFDAUER_MS = 2500;

export default function Simulationslauf({ schritt }: { schritt: number }) {
  const anteil = Math.min(100, (schritt / LAUFSCHRITTE.length) * 100);

  return (
    <Paper
      withBorder
      p="lg"
      radius="sm"
      mt="xl"
      bg="white"
      className="auftritt"
      role="status"
      aria-live="polite"
    >
      <Group gap="sm" align="center" mb="md">
        <Loader size="sm" color="amt.9" />
        <Title order={3}>Runde wird simuliert</Title>
      </Group>

      <Progress value={anteil} size="sm" color="amt.9" mb="md" />

      <ol className="laufliste">
        {LAUFSCHRITTE.map((text, index) => {
          const erledigt = index < schritt;
          const laeuft = index === schritt;
          return (
            <li
              key={text}
              className={`laufliste__schritt${erledigt ? ' laufliste__schritt--fertig' : ''}${
                laeuft ? ' laufliste__schritt--aktiv' : ''
              }`}
            >
              <span className="laufliste__marke" aria-hidden="true">
                {erledigt ? '✓' : laeuft ? '·' : ''}
              </span>
              <span>{text}</span>
            </li>
          );
        })}
      </ol>

      <Text size="xs" c="dimmed" mt="md" maw="70ch">
        Die Rechnung selbst läuft in wenigen Millisekunden. Die Schrittanzeige benennt, was der
        Rechenkern tut; sie misst keine Dauer.
      </Text>
    </Paper>
  );
}
