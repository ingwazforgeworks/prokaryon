\(F(E)=a\,H(E-T)\)

A single step: no output below abundance \(T\), full output \(a\) at or above it. \(H\) is the Heaviside step.

**Used by:** [[Sporulase (SPOR)]], [[Effector Injector (EFFI)]], [[Bdellase (BDEL)]], [[Conjugation Apparatus (CONJ)]], [[Memory Latch (MEML)]], [[Shape Determinant (SHPD)]]

**When it is right.** For anything that is a discrete structure or a state rather than a rate. Half a flagellar apparatus does not propel half as well; half a dormant cell is not a thing. Threshold scaling says so directly instead of approximating it with a steep curve.

**The cost of using it.** Discontinuity makes cells flicker when abundance hovers near \(T\), and the resulting expression is wasted on both sides. Any gene using threshold scaling needs either hysteresis in its [[Conditional|conditional promoter]] or a declared commitment time. See [[Expression]] on response delay.
