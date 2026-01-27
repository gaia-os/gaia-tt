# Active Inference in the GAIA Tech Tree

## Active Inference

In basic inference, a given model's parameters (the prior/posterior) are updated in response to newly observed data.
This is a _passive_ process. In a human, this is updating your mental model of something.

_Active inference_ understands that we can improve the inference process by incorporating one's own actions into the fold.
"I would get a much better understanding of the weather outside if I went and opened the window curtain or simply 
walked outside."
Instead of waiting for data to reach you, go reach the data.

This is mathematically described through the _Variational Free Energy_ (VFE) and _Free Energy Principle_ (FEP), 
which possess a few different lenses for interpretation. 
The full models that incorporate agentic policy predictions are the "expected" forms: The _Expected Free Energy_, the _Free Energy of the Future_, and the _Free Energy of the Expected Future_. 
See [Walters et al. (2025)](https://arxiv.org/abs/2502.04249) and [Beren Millidge et al. (2021)](https://doi.org/10.1162/neco_a_01354).

There is a missing piece to the framework as yet described and that is the incorporation of _preferences_, 
as agents are not _purely_ driven by uncertainty reduction, but also the realization of goals and preferences over world states.
The mathematical details of the above sections is not for discussion here, but visit the given links for more.
Here, we are more interested in...

## Degrees of uncertainty

In modeling intelligence, we can distinguish three levels of latent unknowns: _states_, _parameters_, and _structure_.
And this leads to three active directives: _inference_, _learning_, and _selection_, respectively.
This is further elucidated in [Friston et el. (2025)](https://doi.org/10.48550/arXiv.2512.21129).

In that paper they (pg 2):
> ...introduce a third sort of information gain that pertains to the structure of the generative model. 
> Equipping agents with this kind of intrinsic motivation is in line with the principles of optimum Bayesian design...
> namely, designing an experiment to elicit data that maximally disambiguate hypotheses or generative models.

They go on to explain (pg 3),
> Technically, variational free energy is model complexity minus accuracy, where complexity is the KL  divergence between the posterior and prior (Penny, 2012). Active inference and learning therefore seek the posterior that minimises the divergence from prior beliefs, while providing an accurate account of observed data. 
> However, after all the data have been observed, one can minimise variational free energy by selecting a prior that 
> minimises the divergence from the posterior. This _post-hoc_ selection is generally from a set of priors--over 
> model parameters--that constitute a space of models or hypotheses. 
> One can regard this form of selection as the basis of the scientific process in the following sense: a  scientist elaborates a small model space (e.g., an alternate and null hypothesis), acquires some data  under uninformative priors over her model space, and then finds the hypothesis that best explains her  experimental data (Corcoran et al., 2023; Lindley, 1956). On this view, the best model is that which  renders the data the most likely; namely maximises model evidence or marginal likelihood.
> 
> ...
> 
> Here, we reprise this paradigm to  demonstrate active reasoning or reduction, where the focus is on selecting the 
> right data--c.f.,  performing the right experiments--that resolve uncertainty about the models or hypotheses 
> entertained.

Regarding "Active Selection" (pg 11), 
> In contrast to [active] learning--that optimises _posteriors_ over parameters--Bayesian model selection or structure 
> learning (Tenenbaum et al., 2011; Tervo et al., 2016; Tomasello, 2016) can be framed as  optimising the _priors_ 
> over model parameters...
> On this view, model selection can be implemented  efficiently using Bayesian model reduction.

So, the VFE is minimized as a _functional_ of posteriors/priors (which functions for these can be selected so as to 
minimize the VFE). "If one associates different model structures with a set of prior constraints on the parameters of 
a generative model, one has a straightforward mechanism to absorb structure learning into the minimization of VFE" 
(pg 28).

In essence, the game is to add an outer "structure learning" optimization loop where Bayesian model reduction
is carried out across a distribution of possible priors.
Fun fact: This is suggested in the literature as mirroring the process and purpose of sleep in the brain.
The cited paper concerns itself with how one should gather data to optimize this structure learning.
This looks like extending the _expected_ free energy, which is often a sampling process, to also consider expected 
information gain over model priors (pg 28):

> We have illustrated this using Bayesian model reduction to evaluate a posterior over models--before and after 
> acting under a particular policy--to evaluate the expected information gain, in accord with the principles of 
> optimal experimental design.

## How can this help the GTT?

Off the bat, we can readily determine/set state preferences based on user-defined metrics, such as TWh.
In ActInf, preferences are encoded as probability distributions (preference priors), and as such they need to be 
normalizable functions.
But they don't need to be continuous or "natural".
For example, we could describe a linearly increasing preference for TWh that truncates at some maximum (and minimum).
Such a function can normalize to 1. It could also be step-wise or exponential etc.

From here, we can plug this into our Free Energy loss function, and evaluate simulated decision trajectories accordingly.
This is akin to work done in [Walters et al. (2025)](https://arxiv.org/abs/2502.04249) where simulated autonomous-vehicle
trajectories were evaluated according to a preference prior composed of different highway (world) states (speed, neighbor proximity, collision occurrence, etc.).
We termed this metric Cumulative Risk Exposure (CRE), and we could decide to directly plug this into the GTT.

So far though, there is nothing really "Active Inference-y" about what was described.
We could just weigh trajectories based on expected TWh, which is kind of how things shake-out in the mentioned paper.
In such approaches, no _inference_ is performed: There are no latent data-generating variables we are trying to infer,
which is an essential ingredient to full active inference.

For the purposes of the GTT, something like _Bayesian Experimental Design_ (BED) or other similar methods treat
experimental choices as latent variables with the goal _of what data to collect to learn as much as possible about unknown quantities (parameters, models, or structures), given current uncertainty._

The BED process simulates many possible experimental outcomes based on current beliefs, evaluates how much each 
potential outcome would update your knowledge, and then averages across all possibilities to find which experimental design has the highest expected utility. 
This expected utility is often measured using concepts like mutual information or expected reduction in entropy.

With a BED, 

In sum, ActInf unifies:
- Model comparison (via evidence)
- Model learning (via variational updates)
- Experiment design (via epistemic action)

into the single objective of expected free energy minimization.
