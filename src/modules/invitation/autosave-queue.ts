export type AutosaveSuccess = { success: true; contentVersion: number };
export type AutosaveFailure = {
  success: false;
  code: "VERSION_CONFLICT" | "TEMPORARY_ERROR" | "VALIDATION_ERROR";
};
export type AutosaveResult = AutosaveSuccess | AutosaveFailure;

export class AutosaveQueue<T> {
  private active = false;
  private pending = false;
  private generation = 0;
  private acknowledgedGeneration = 0;
  private latestSnapshot: T | undefined;
  private version: number;

  constructor(
    initialVersion: number,
    private readonly persist: (snapshot: T, expectedVersion: number) => Promise<AutosaveResult>,
  ) {
    this.version = initialVersion;
  }

  markDirty(snapshot: T): number {
    this.latestSnapshot = snapshot;
    this.generation += 1;
    this.pending = true;
    return this.generation;
  }

  async flush(): Promise<AutosaveResult | null> {
    if (this.active || !this.pending || this.latestSnapshot === undefined) return null;

    this.active = true;
    let result: AutosaveResult = { success: true, contentVersion: this.version };
    while (this.pending && this.latestSnapshot !== undefined) {
      this.pending = false;
      const requestGeneration = this.generation;
      const snapshot = this.latestSnapshot;
      result = await this.persist(snapshot, this.version);
      if (!result.success) {
        this.active = false;
        return result;
      }

      this.version = Math.max(this.version, result.contentVersion);
      this.acknowledgedGeneration = requestGeneration;
      if (this.generation > requestGeneration) this.pending = true;
    }
    this.active = false;
    return result;
  }

  adoptServerVersion(contentVersion: number): void {
    if (!Number.isInteger(contentVersion) || contentVersion < 1) return;
    this.version = Math.max(this.version, contentVersion);
  }

  get state() {
    return {
      isSaving: this.active,
      pendingSave: this.pending,
      localEditGeneration: this.generation,
      lastAckedGeneration: this.acknowledgedGeneration,
      contentVersion: this.version,
    };
  }
}
