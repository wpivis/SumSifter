export interface BrushState {
    hasBrush: boolean;
    x1: number;
    x2: number;
    y1: number;
    y2: number;

    ids: string[];
  }

export type SelectionType = 'drag' | 'handle' | 'clear' | null

export type BrushNames = 'Rectangular Selection' | 'Axis Selection' | 'Slider Selection' | 'Paintbrush Selection'

export interface BrushParams {brushType: BrushNames, dataset: string, x: string, y: string, category: string, ids: string, dataType?: 'date'}

export interface SumParams {prompt: string, documents: string[]}

export interface SumContent {
  id: string, text: string, sources: string[]
}

export interface SumSource {
  id: number;
  content: SumContent[];
}

export interface SumSummary {
  id: number;
  conversationId: string;
  content: SumContent[];
}

export interface SumGlobalSummary {
  id: number;
  conversationId: string;
  content: SumContent[];

}
