export interface RankingStrategy {
  /**
   * Calcula nuevos rankings para ambos equipos a partir de los rankings actuales.
   * Se asume que el equipo "ganador" obtiene score 1 y el "perdedor" score 0.
   */
  calcularNuevoRankingEquipos(input: {
    rankingGanadores: number[];
    rankingPerdedores: number[];
  }): {
    nuevosGanadores: number[];
    nuevosPerdedores: number[];
  };
}
