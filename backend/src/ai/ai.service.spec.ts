import { AiService } from './ai.service';

describe('AiService', () => {
  let service: AiService;

  beforeEach(() => {
    service = new AiService();
  });

  describe('suggestCategory', () => {
    it('categorizes electricity-related reports', () => {
      expect(service.suggestCategory('Dritë e prishur', 'Llambë në sallë është djegur')).toBe('Elektricitet');
    });

    it('categorizes plumbing-related reports', () => {
      expect(service.suggestCategory('Uji rrjedh', 'Rubineti në banjo rrjedh vazhdimisht')).toBe('Hidraulikë');
    });

    it('categorizes IT-related reports', () => {
      expect(service.suggestCategory('Interneti nuk punon', 'Wifi në bibliotekë nuk lidhet')).toBe('Internet / IT');
    });

    it('falls back to "Tjetër" when no keywords match', () => {
      expect(service.suggestCategory('Diçka e çuditshme', 'Nuk di si ta përshkruaj')).toBe('Tjetër');
    });
  });

  describe('estimateUrgency', () => {
    it('flags danger keywords as high urgency', () => {
      expect(service.estimateUrgency('Rrezik zjarri', 'Ka rrezik shkurtcuit në sallë')).toBe('high');
    });

    it('treats long descriptions without urgent keywords as medium', () => {
      const longText = 'a'.repeat(250);
      expect(service.estimateUrgency('Titull normal', longText)).toBe('medium');
    });

    it('treats short, calm descriptions as low urgency', () => {
      expect(service.estimateUrgency('Karrige e thyer', 'Një karrige ka nevojë për riparim')).toBe('low');
    });
  });

  describe('similarity', () => {
    it('returns 1 for identical text', () => {
      expect(service.similarity('dritat nuk punojne', 'dritat nuk punojne')).toBe(1);
    });

    it('returns 0 for completely different text', () => {
      expect(service.similarity('dritat nuk punojne', 'uji rrjedh ne banjo')).toBe(0);
    });

    it('returns a partial score for overlapping text', () => {
      const score = service.similarity('dritat ne salle nuk punojne', 'dritat ne salle jane te fikura');
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });
  });

  describe('isLikelyDuplicate', () => {
    it('flags near-identical titles as duplicates', () => {
      expect(service.isLikelyDuplicate('dritat ne salle B3 nuk punojne', 'dritat ne salle B3 nuk punojne')).toBe(true);
    });

    it('does not flag unrelated titles as duplicates', () => {
      expect(service.isLikelyDuplicate('dritat ne salle nuk punojne', 'uji rrjedh ne banjo')).toBe(false);
    });
  });
});
