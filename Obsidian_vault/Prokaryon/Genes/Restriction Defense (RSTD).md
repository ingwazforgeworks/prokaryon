**Gene ID:** RSTD  
**Gene Name:** Restriction Defense  
**Category:** [[Reproduction]]  
**Status:** Proposed  
**Description:** Recognises and destroys foreign genetic material entering the cell. Blocks unwanted genes, hostile cargo, and gifts, without distinguishing between them.  
**Inputs:** [[Biomass]], [[ATP]]  
**Outputs:** Rejection of incoming genetic payloads  
**Expression scaling:** [[Saturating Scaling]] — rejection probability approaches but never reaches certainty  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cytosol  
**Tradeoff:** There is no configuration that accepts only the good things. A cell expressing RSTD is protected from parasitic cassettes and cut off from every benefit of [[Horizontal Gene Transfer]], and it pays upkeep for a threat that may never arrive.  
**Design basis:** Restriction-modification systems that cleave unmethylated foreign DNA.

**The exposure dial.** This gene is how a player sets their lineage's openness, and both extremes are viable and costly:

| | RSTD absent | RSTD expressed |
|---|---|---|
| Adaptation rate | Fast — can acquire anything nearby | Slow — relies only on purchased edits |
| Parasitic burden | Vulnerable to hostile cassettes | Protected |
| Social position | A trading partner | Isolated |

**Why it is Proposed while its neighbours are Open.** Rejection is the one behaviour in [[Horizontal Gene Transfer]] that is well-defined regardless of how decisions D19–D25 land: whatever the payload, whatever the consent rule, destroying incoming DNA has the same meaning. Specification §8.3 requires that duplicate genes, incompatible cassettes, insertion limits, rejection and removal all be defined, and this gene owns the rejection case.

It shares its shape with [[Envelope Defensin (DEFN)]]: defence against interaction is defence against all interaction.
