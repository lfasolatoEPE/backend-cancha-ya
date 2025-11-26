import { RankingStrategy } from './ranking-strategy';

export class EloTeamStrategy implements RankingStrategy {
  private readonly K = 32;

  calcularNuevoRankingEquipos(input: {
    rankingGanadores: number[];
    rankingPerdedores: number[];
  }) {
    const { rankingGanadores, rankingPerdedores } = input;

    const promedio = (xs: number[]) =>
      xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

    const promedioGanador = promedio(rankingGanadores);
    const promedioPerdedor = promedio(rankingPerdedores);

    // probabilidad esperada de ganar del equipo ganador
    const expectedGanador =
      1 / (1 + Math.pow(10, (promedioPerdedor - promedioGanador) / 400));
    const expectedPerdedor = 1 - expectedGanador;

    const nuevosGanadores = rankingGanadores.map((r) =>
      Math.round(r + this.K * (1 - expectedGanador))
    );

    const nuevosPerdedores = rankingPerdedores.map((r) =>
      Math.round(r + this.K * (0 - expectedPerdedor))
    );

    return { nuevosGanadores, nuevosPerdedores };
  }
}
