import { Injectable } from '@nestjs/common';

/**
 * AiService
 * ---------
 * Lightweight, dependency-free AI/heuristics engine that fulfils the
 * "Innovation" section of the CampusFix proposal:
 *   - Automatic categorization of a report from its title/description
 *   - Urgency (priority) estimation
 *   - Duplicate-report detection
 *
 * This is implemented with transparent, explainable rule-based NLP
 * (keyword matching + text similarity) so it works fully offline with
 * zero external cost. It is designed to be swapped later for a call to
 * a hosted LLM / ML model without changing its public interface.
 */
@Injectable()
export class AiService {
  private readonly categoryKeywords: Record<string, string[]> = {
    'Elektricitet': ['dritë', 'llambë', 'rrymë', 'kabllo', 'prizë', 'elektrik'],
    'Hidraulikë': ['ujë', 'tualet', 'rubinet', 'rrjedh', 'kanalizim', 'lavaman'],
    'Internet / IT': ['internet', 'wifi', 'rrjet', 'kompjuter', 'projektor', 'router'],
    'Pastërti': ['pisët', 'plehra', 'pastrim', 'baltë', 'papastërti'],
    'Mobilje / Pajisje': ['karrige', 'tavolinë', 'derë', 'dritare', 'bankë', 'thyer'],
    'Siguri': ['rrezik', 'zjarr', 'siguri', 'kamera', 'alarm', 'urgjent'],
  };

  private readonly urgentKeywords = ['urgjent', 'rrezik', 'zjarr', 'shkurtcuit', 'rrjedh', 'siguri'];

  /** Suggests the best-matching category name based on keyword overlap. */
  suggestCategory(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    let bestCategory = 'Tjetër';
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      const score = keywords.reduce((acc, kw) => (text.includes(kw) ? acc + 1 : acc), 0);
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }
    return bestCategory;
  }

  /** Estimates urgency: 'high' | 'medium' | 'low' based on keyword signals. */
  estimateUrgency(title: string, description: string): 'high' | 'medium' | 'low' {
    const text = `${title} ${description}`.toLowerCase();
    const hasUrgentSignal = this.urgentKeywords.some((kw) => text.includes(kw));
    if (hasUrgentSignal) return 'high';
    if (text.length > 200) return 'medium';
    return 'low';
  }

  /**
   * Naive Jaccard similarity between two strings (token-based).
   * Used to flag likely duplicate reports (e.g. score > 0.6).
   */
  similarity(a: string, b: string): number {
    const tokenize = (s: string) =>
      new Set(
        s
          .toLowerCase()
          .replace(/[^a-zë0-9\s]/gi, '')
          .split(/\s+/)
          .filter(Boolean),
      );
    const setA = tokenize(a);
    const setB = tokenize(b);
    if (setA.size === 0 || setB.size === 0) return 0;
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  }

  /** Returns true if candidate text looks like a duplicate of existing text. */
  isLikelyDuplicate(candidateTitle: string, existingTitle: string, threshold = 0.6): boolean {
    return this.similarity(candidateTitle, existingTitle) >= threshold;
  }
}
