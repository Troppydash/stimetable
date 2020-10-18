export interface PositionOffset {
    relX: number,
    relY: number
}

export interface ClientOffset {
    clientX: number,
    clientY: number,
}

export function PageOffsetToRelOffset( parent: HTMLElement, clientOffset: ClientOffset ): PositionOffset {
    const rect = parent.getBoundingClientRect();
    const relX = clientOffset.clientX - rect.left;
    const relY = clientOffset.clientY - rect.top;
    return {
        relX,
        relY
    }
}
