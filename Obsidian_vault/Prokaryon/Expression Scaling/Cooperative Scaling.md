\(F(E)=\dfrac{aE^{n}}{K^{n}+E^{n}}\)

The Hill form. A sigmoid: sluggish at low abundance, steep through the middle, saturating at \(a\). The exponent \(n\) sets the sharpness — at \(n=1\) this reduces to [[Saturating Scaling]], and as \(n\) grows it approaches [[Threshold Scaling]].

**Used by:** regulator-driven responses where a graded switch is wanted — [[Repressor (REPX)]], [[Activator (ACTX)]]

**Why it earns its extra parameter.** It is the only scaling form that is switch-like *and* continuous, which makes it the natural fit for [[Regulation]]: a repressor should silence its targets decisively once it accumulates, without the flicker that a hard step produces near its boundary.

It also gives one tunable curve family covering the whole range between graded and all-or-nothing, so a content author can move a gene along that axis by changing \(n\) instead of swapping its scaling type.
