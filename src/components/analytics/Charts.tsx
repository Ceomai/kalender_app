import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { FONTS, useTheme } from '@/src/theme';

type Slice = { key: string; value: number; color: string };

function arcPath(cx: number, cy: number, r: number, inner: number, start: number, end: number) {
  const point = (radius: number, angle: number) => [cx + radius * Math.sin(angle), cy - radius * Math.cos(angle)];
  const [x1, y1] = point(r, start);
  const [x2, y2] = point(r, end);
  const [x3, y3] = point(inner, end);
  const [x4, y4] = point(inner, start);
  const large = end - start > Math.PI ? 1 : 0;
  return `M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${inner} ${inner} 0 ${large} 0 ${x4} ${y4} Z`;
}

/** Donut like the web's recharts Pie (innerRadius 45, outerRadius 80, paddingAngle 2). */
export function Donut({ data, size = 176 }: { data: Slice[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const c = size / 2;
  const outer = (size / 176) * 80;
  const inner = (size / 176) * 45;
  const gap = data.length > 1 ? (2 * Math.PI) / 180 : 0;
  let angle = 0;
  return (
    <Svg width={size} height={size}>
      {total > 0 &&
        data.map((d) => {
          const sweep = (d.value / total) * Math.PI * 2;
          const start = angle + gap / 2;
          const end = angle + sweep - gap / 2;
          angle += sweep;
          if (end <= start) return null;
          // A full circle cannot be one arc; draw it as two halves.
          if (sweep >= Math.PI * 2 - 0.001) {
            return (
              <G key={d.key}>
                <Path d={arcPath(c, c, outer, inner, 0, Math.PI)} fill={d.color} />
                <Path d={arcPath(c, c, outer, inner, Math.PI, Math.PI * 2 - 0.0001)} fill={d.color} />
              </G>
            );
          }
          return <Path key={d.key} d={arcPath(c, c, outer, inner, start, end)} fill={d.color} />;
        })}
    </Svg>
  );
}

/** Bar chart like the web's (rounded tops, axis-less, primary colour). */
export function Bars({ data, height = 208 }: { data: { label: string; value: number }[]; height?: number }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const max = Math.max(1, ...data.map((d) => d.value));
  const ticks = Array.from(new Set([0, max / 2, max].map((v) => Math.round(v))));
  const left = 28;
  const bottom = 20;
  const plotH = height - bottom - 8;
  const slot = width > left ? (width - left) / data.length : 0;
  const barW = Math.max(4, slot * 0.6);

  return (
    <View style={styles.full} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {ticks.map((tick) => (
            <SvgText
              key={tick}
              x={left - 6}
              y={8 + plotH - (tick / max) * plotH + 4}
              fontSize={11}
              fontFamily={FONTS.body}
              fill={colors.mutedForeground}
              textAnchor="end"
            >
              {tick}
            </SvgText>
          ))}
          {data.map((d, i) => {
            const h = (d.value / max) * plotH;
            const x = left + i * slot + (slot - barW) / 2;
            const y = 8 + plotH - h;
            const r = Math.min(6, barW / 2, h);
            return (
              <G key={d.label}>
                {h > 0 && (
                  <Path
                    d={`M${x} ${y + h} V${y + r} Q${x} ${y} ${x + r} ${y} H${x + barW - r} Q${x + barW} ${y} ${x + barW} ${y + r} V${y + h} Z`}
                    fill={colors.primary}
                  />
                )}
                {h === 0 && <Rect x={x} y={8 + plotH - 1} width={barW} height={1} fill={colors.border} />}
                <SvgText
                  x={x + barW / 2}
                  y={height - 4}
                  fontSize={11}
                  fontFamily={FONTS.body}
                  fill={colors.mutedForeground}
                  textAnchor="middle"
                >
                  {d.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  full: { width: '100%' },
});
