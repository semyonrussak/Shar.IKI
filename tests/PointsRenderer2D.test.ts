import { PointsRenderer2D } from '../src/2d/rendering-utils/PointsRenderer2D';

describe('PointsRenderer2D', () => {
    const mockEngine = { getScene: () => ({ add: jest.fn(), remove: jest.fn() }) } as any;
    const mockPM = { projectPoint: jest.fn(() => ({ x: 0, y: 0 })) } as any;

    it('should create an instance', () => {
        const renderer = new PointsRenderer2D(mockEngine, mockPM);
        expect(renderer).toBeDefined();
    });

    it('should handle empty data', () => {
        const renderer = new PointsRenderer2D(mockEngine, mockPM);
        expect(() => renderer.setData([])).not.toThrow();
    });
});