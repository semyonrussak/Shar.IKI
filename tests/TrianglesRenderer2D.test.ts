import { TrianglesRenderer2D, TriangleData2D } from '../src/2d/rendering-utils/TrianglesRenderer2D';

describe('TrianglesRenderer2D', () => {
    it('should create an instance without errors', () => {
        const engine = { getScene: () => ({ add: jest.fn() }) } as any;
        const pm = { projectPoint: jest.fn(() => ({ x: 0, y: 0 })) } as any;
        const renderer = new TrianglesRenderer2D(engine, pm);
        expect(renderer).toBeDefined();
    });

    it('should handle empty data without throwing', () => {
        const engine = { getScene: () => ({ add: jest.fn() }) } as any;
        const pm = { projectPoint: jest.fn() } as any;
        const renderer = new TrianglesRenderer2D(engine, pm);
        expect(() => renderer.setData([])).not.toThrow();
    });
});