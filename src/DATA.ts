import { NodeLabel, TechTree, InvestTechTreeGraph } from './lib/types';
import { nodeDescriptions } from './lib/nodeDescriptions';

const tech_tree: InvestTechTreeGraph = {
  nodes: [
    {
      id: 'concept_lts_tokamak',
      label: 'LTS Tokamak',
      type: 'ReactorConcept',
      category: 'Fusion',
      trl_current: '5-6',
      references: [
        'https://www.iter.org/mach/Magnets',
        'https://www.jt60sa.org/wp/magnets/',
        'https://www.iter.org/few-lines',
      ],
    },
    {
      id: 'milestone_lts_physics_validation',
      label: 'LTS Tokamak Physics Validation',
      type: 'Milestone',
      subtype: 'PhysicsDemonstration',
      trl_current: '5',
      references: [
        'https://www.jt60sa.org/wp/',
        'https://www.qst.go.jp/site/news/20241004.html',
        'https://euro-fusion.org/devices/jt-60sa/',
      ],
    },
    {
      id: 'milestone_iter_construction',
      label: 'ITER Burning Plasma Demo',
      type: 'Milestone',
      subtype: 'PrototypeConstruction',
      trl_current: '5-6',
      references: [
        'https://www.iter.org/node/20687/what-burning-plasma',
        'https://www.energy.gov/science/doe-explainsburning-plasma',
        'https://www.iter.org/few-lines',
      ],
    },
    {
      id: 'concept_hts_tokamak',
      label: 'HTS Tokamak',
      type: 'ReactorConcept',
      category: 'Fusion',
      trl_current: '4-5',
      references: [
        'https://cfs.energy/technology/',
        'https://cfs.energy/technology/sparc/',
        'https://news.mit.edu/2021/MIT-CFS-major-advance-toward-fusion-energy-0908',
      ],
    },
    {
      id: 'milestone_hts_magnet_demo',
      label: 'Large-Scale HTS Magnet Demo',
      type: 'Milestone',
      subtype: 'ComponentTest',
      trl_current: '4-5',
      references: [
        'https://news.mit.edu/2021/MIT-CFS-major-advance-toward-fusion-energy-0908',
        'https://htsmagnet.cfs.energy/',
        'https://www-new.psfc.mit.edu/news/multimedia/2021/highlights-of-the-mit-cfs-20t-magnet-demo-event',
      ],
    },
    {
      id: 'milestone_sparc_net_energy',
      label: 'SPARC Net Energy Demo',
      type: 'Milestone',
      subtype: 'PrototypeConstruction',
      trl_current: '4',
      trl_projected_5_10_years: '6',
      references: [
        'https://cfs.energy/technology/sparc/',
        'https://www.cambridge.org/core/journals/journal-of-plasma-physics/collections/status-of-the-sparc-physics-basis',
        'https://www-new.psfc.mit.edu/sparc',
      ],
    },
    {
      id: 'concept_stellarator',
      label: 'Stellarator',
      type: 'ReactorConcept',
      category: 'Fusion',
      trl_current: '4-5',
      references: [
        'https://www.ipp.mpg.de/w7x',
        'https://www.energy.gov/science/articles/fusion-twist-improving-stellarators',
        'https://en.wikipedia.org/wiki/Stellarator',
      ],
    },
    {
      id: 'milestone_w7x_optimization_proof',
      label: 'W7-X Optimized Physics Proof',
      type: 'Milestone',
      subtype: 'PhysicsDemonstration',
      trl_current: '4-5',
      references: [
        'https://www.ipp.mpg.de/5125328/05_21',
        'https://www.ipp.mpg.de/5532945/w7x',
        'https://fusion.bsc.es/index.php/2018/07/13/wendelstein-7-x-achieves-a-stellarator-world-record/',
      ],
    },
    {
      id: 'milestone_hts_stellarator_coil_fab',
      label: 'HTS Stellarator Coil Fabrication',
      type: 'Milestone',
      subtype: 'ComponentTest',
      trl_current: '2-3',
      trl_projected_5_10_years: '4',
      references: [
        'https://www.ipp.mpg.de/5548072/hts4fusion',
        'https://www.energy.gov/science/articles/fusion-twist-improving-stellarators',
        'https://www.pppl.gov/advanced-projects',
      ],
    },
    {
      id: 'concept_frc',
      label: 'Field-Reversed Configuration',
      type: 'ReactorConcept',
      category: 'Fusion',
      trl_current: '4',
      references: [
        'https://www.tae.com/technology/',
        'https://aip.scitation.org/doi/10.1063/1.3601760',
        'https://en.wikipedia.org/wiki/Field-reversed_configuration',
      ],
    },
    {
      id: 'milestone_frc_stable_sustainment',
      label: 'FRC Stable Sustainment',
      type: 'Milestone',
      subtype: 'PhysicsDemonstration',
      trl_current: '4',
      references: [
        'https://www.tae.com/technology/',
        'https://www.nature.com/articles/s41586-021-03675-1',
      ],
    },
    {
      id: 'milestone_frc_net_energy',
      label: 'FRC Net Energy Demo',
      type: 'Milestone',
      subtype: 'PrototypeConstruction',
      trl_current: '3',
      trl_projected_5_10_years: '5',
      references: [
        'https://www.tae.com/projects/copernicus/',
        'https://www.tae.com/technology/',
      ],
    },
    {
      id: 'concept_icf',
      label: 'Inertial Confinement Fusion',
      type: 'ReactorConcept',
      category: 'Fusion',
      trl_current: '2-3',
      references: [
        'https://www.iaea.org/bulletin/burning-plasma',
        'https://lasers.llnl.gov/science/how-nif-works',
      ],
    },
    {
      id: 'milestone_nif_ignition',
      label: 'NIF Single-Shot Ignition',
      type: 'Milestone',
      subtype: 'PhysicsDemonstration',
      trl_current: '5-6',
      references: [
        'https://lasers.llnl.gov/news/age-ignition',
        'https://www.energy.gov/articles/doe-national-laboratory-makes-history-achieving-fusion-ignition',
        'https://www.llnl.gov/news/ignition',
      ],
    },
    {
      id: 'milestone_ife_driver_dev',
      label: 'IFE High-Rep-Rate Driver',
      type: 'Milestone',
      subtype: 'ComponentDevelopment',
      trl_current: '2-3',
      trl_projected_5_10_years: '4-5',
      references: [
        'https://nap.nationalacademies.org/catalog/26791/bringing-fusion-to-the-us-grid',
        'https://www.eli-beams.eu/en/facility/eli-beamlines/laser-systems/hapls/',
        'https://lasers.llnl.gov/news/llnls-breakthrough-ignition-experiment-highlighted-in-physical-review-letters',
      ],
    },
    {
      id: 'concept_z_pinch',
      label: 'Z-Pinch',
      type: 'ReactorConcept',
      category: 'Fusion',
      trl_current: '4',
      references: [
        'https://www.sandia.gov/research/research-foundations/pulsed-power-science-technology/z-machine/',
        'https://en.wikipedia.org/wiki/Z-pinch',
      ],
    },
    {
      id: 'milestone_sfs_z_pinch_stability',
      label: 'Sheared-Flow Z-Pinch Stability',
      type: 'Milestone',
      subtype: 'PhysicsDemonstration',
      trl_current: '4',
      references: [
        'https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.87.205003',
        'https://www.zapenergy.com/technology',
      ],
    },
    {
      id: 'concept_lwr_smr',
      label: 'Light Water SMR',
      type: 'ReactorConcept',
      category: 'Fission',
      trl_current: '7-8',
      references: [
        'https://www.iaea.org/topics/small-modular-reactors',
        'https://world-nuclear.org/information-library/nuclear-fuel-cycle/nuclear-power-reactors/small-nuclear-power-reactors',
      ],
    },
    {
      id: 'milestone_lwr_smr_design_approval',
      label: 'SMR Standard Design Approval',
      type: 'Milestone',
      subtype: 'Regulatory',
      trl_current: '7-8',
      references: [
        'https://www.nrc.gov/reactors/new-reactors/advanced/who-were-working-with/applicant-projects/nuscale-us460.html',
        'https://www.govinfo.gov/app/details/FR-2025-06-04/2025-10123',
      ],
    },
    {
      id: 'milestone_lwr_smr_first_build',
      label: 'First Commercial SMR Build',
      type: 'Milestone',
      subtype: 'CommercialDeployment',
      trl_current: '7',
      trl_projected_5_10_years: '9',
      references: [
        'https://www.cnnc.com.cn/english/zxzx_1/gtgc/202407/2d5e7dbe1c8d4c7dbb7a1a3e7d1a7e9f.shtml',
        'https://world-nuclear.org/information-library/country-profiles/countries-a-f/china-nuclear-power#ACP100',
      ],
    },
    {
      id: 'concept_htgr',
      label: 'High-Temp Gas Reactor',
      type: 'ReactorConcept',
      category: 'Fission',
      trl_current: '6-7',
      references: [
        'https://www.iaea.org/topics/high-temperature-gas-cooled-reactors-htgrs',
        'https://world-nuclear.org/information-library/nuclear-fuel-cycle/nuclear-power-reactors/advanced-nuclear-power-reactors#High-temperature-gas-cooled-reactors',
      ],
    },
    {
      id: 'milestone_htgr_demo_reactors',
      label: 'HTGR Demo Reactor Operation',
      type: 'Milestone',
      subtype: 'PrototypeDemonstration',
      trl_current: '6-7',
      references: [
        'https://www.cnnc.com.cn/cnnc/xwzx65/ttyw_5916/202312/4a5a4a8fefc447d7b2d7d7ea3b5b3b7f.shtml',
        'https://world-nuclear-news.org/Articles/China-connects-HTR-PM-to-the-grid',
      ],
    },
    {
      id: 'concept_msr',
      label: 'Molten Salt Reactor',
      type: 'ReactorConcept',
      category: 'Fission',
      trl_current: '3-4',
      references: [
        'https://www.iaea.org/topics/molten-salt-reactors',
        'https://world-nuclear.org/information-library/nuclear-fuel-cycle/nuclear-power-reactors/advanced-nuclear-power-reactors#Molten-salt-reactors',
      ],
    },
    {
      id: 'milestone_msre_operation',
      label: 'MSRE Proof-of-Concept',
      type: 'Milestone',
      subtype: 'PhysicsDemonstration',
      trl_current: '4',
      references: [
        'https://www.ornl.gov/content/molten-salt-reactor-experiment-msre',
        'https://www.osti.gov/opennet/msre',
      ],
    },
    {
      id: 'milestone_msr_materials_qualification',
      label: 'MSR Materials & Chemistry Control',
      type: 'Milestone',
      subtype: 'ComponentDevelopment',
      trl_current: '3-4',
      trl_projected_5_10_years: '5-6',
      references: [
        'https://www.ornl.gov/group/chemical-sciences',
        'https://www.iaea.org/publications/14561/status-of-molten-salt-reactor-technology',
      ],
    },
    {
      id: 'concept_sfr',
      label: 'Sodium-Cooled Fast Reactor',
      type: 'ReactorConcept',
      category: 'Fission',
      trl_current: '5-6',
      references: [
        'https://www.gen-4.org/gif/jcms/c_42153/sodium-cooled-fast-reactor-sfr',
        'https://world-nuclear.org/information-library/nuclear-fuel-cycle/nuclear-power-reactors/fast-neutron-reactors',
      ],
    },
    {
      id: 'milestone_sfr_prototype_operation',
      label: 'SFR Prototype Reactor Operation',
      type: 'Milestone',
      subtype: 'PrototypeDemonstration',
      trl_current: '5-6',
      references: [
        'https://www.cnnc.com.cn/english/zxzx_1/gtgc/202312/69c0e3e9f01c4dfaa6c8ea5e1e9c8d67.shtml',
        'https://world-nuclear.org/information-library/country-profiles/countries-a-f/china-nuclear-power#FastReactors',
      ],
    },
    {
      id: 'concept_lfr',
      label: 'Lead-Cooled Fast Reactor',
      type: 'ReactorConcept',
      category: 'Fission',
      trl_current: '3-4',
      references: [
        'https://www.gen-4.org/gif/jcms/c_42154/lead-cooled-fast-reactor-lfr',
        'https://world-nuclear.org/information-library/nuclear-fuel-cycle/nuclear-power-reactors/fast-neutron-reactors#Lead-cooled-fast-reactors',
      ],
    },
    {
      id: 'milestone_lfr_materials_qualification',
      label: 'LFR Materials Qualification',
      type: 'Milestone',
      subtype: 'ComponentDevelopment',
      trl_current: '3-4',
      trl_projected_5_10_years: '5',
      references: [
        'https://myrrha.be/technology',
        'https://www.oecd-nea.org/jcms/pl_20662/materials-and-chemistry-studies-for-lead-alloy-coolants',
      ],
    },
    {
      id: 'concept_twr',
      label: 'Traveling Wave Reactor',
      type: 'ReactorConcept',
      category: 'Fission',
      trl_current: '2-3',
      references: [
        'https://www.terrapower.com/our-work/traveling-wave-reactor/',
        'https://en.wikipedia.org/wiki/Traveling_wave_reactor',
      ],
    },
    {
      id: 'milestone_twr_fuel_qualification',
      label: 'TWR Extreme-Burnup Fuel',
      type: 'Milestone',
      subtype: 'ComponentDevelopment',
      trl_current: '2-3',
      references: [
        'https://www.anl.gov/nse/metal-fuels-technology',
        'https://inl.gov/research-programs/advanced-nuclear-fuels/',
      ],
    },
    {
      id: 'tech_hts_magnets',
      label: 'HTS Magnets',
      type: 'EnablingTechnology',
      trl_current: '4-5 (Tokamaks); 2-3 (Stellarators)',
      references: [
        'https://news.mit.edu/2021/MIT-CFS-major-advance-toward-fusion-energy-0908',
        'https://cfs.energy/news-and-media/cfs-commercial-fusion-power-with-hts-magnet/',
        'https://www-new.psfc.mit.edu/research/topics/high-temperature-superconductors',
      ],
    },
    {
      id: 'tech_triso_fuel',
      label: 'TRISO Fuel Cycle',
      type: 'EnablingTechnology',
      trl_current: '7-8 (Fabrication); 2-3 (Processing)',
      references: [
        'https://inl.gov/research-programs/advanced-nuclear-fuels/',
        'https://art.inl.gov/News%20Highlight%20Attachments/TRISO-particles-most-robust.pdf',
        'https://www.nrc.gov/docs/ML2114/ML21140A413.pdf',
      ],
    },
    {
      id: 'tech_metallic_fuel',
      label: 'Metallic Fuel Cycle',
      type: 'EnablingTechnology',
      trl_current: '6-7',
      references: [
        'https://www.anl.gov/nse/metal-fuels-technology',
        'https://inl.gov/research-programs/advanced-nuclear-fuels/',
      ],
    },
    {
      id: 'tech_tritium_breeding',
      label: 'Tritium Breeding Blankets',
      type: 'EnablingTechnology',
      trl_current: '3-4',
      references: [
        'https://www.iter.org/mach/TBM',
        'https://euro-fusion.org/programme/breeding-blankets/',
      ],
    },
    {
      id: 'tech_pfm',
      label: 'Plasma-Facing Materials',
      type: 'EnablingTechnology',
      trl_current: '3-4',
      references: [
        'https://euro-fusion.org/programme/materials/',
        'https://www.iaea.org/topics/fusion/plasma-facing-materials',
      ],
    },
    {
      id: 'tech_haleu',
      label: 'HALEU Fuel Supply',
      type: 'EnablingTechnology',
      trl_current: '3-4 (Production)',
      references: [
        'https://www.energy.gov/ne/haleu-availability-program',
        'https://www.energy.gov/ne/articles/centrus-reaches-900-kilogram-mark-haleu-production',
        'https://investors.centrusenergy.com/news-releases/news-release-details/centrus-begin-haleu-production-october',
      ],
    },
    {
      id: 'tech_power_cycle_sco2',
      label: 'sCO2 Power Cycle',
      type: 'EnablingTechnology',
      trl_current: '5-6',
      references: [
        'https://www.swri.org/markets/energy-environment/power-generation-utilities/advanced-power-systems/supercritical-transformational-electric-power-pilot-plant',
        'https://www.netl.doe.gov/research/coal/energy-systems/turbines/supercritical-co2',
        'https://www.gti.energy/step-demo/step-demo-news-and-events/',
      ],
    },
    {
      id: 'milestone_step_demo_operation',
      label: 'STEP sCO2 Demo Plant Operation',
      type: 'Milestone',
      subtype: 'PrototypeDemonstration',
      trl_current: '6',
      references: [
        'https://www.swri.org/newsroom/press-releases/step-demo-supercritical-co2-pilot-plant-generates-electricity-the-first-time',
        'https://www.swri.org/newsroom/press-releases/step-demo-pilot-plant-achieves-full-operational-conditions-phase-1-of-testing',
        'https://www.swri.org/newsroom/press-releases/swri-gti-energy-ge-celebrate-mechanical-completion-of-155-million-supercritical-co2-pilot-plant',
      ],
    },
    {
      id: 'tech_ai_ml_control',
      label: 'AI/ML for Control & Design',
      type: 'EnablingTechnology',
      trl_current: '3-5',
      references: [
        'https://www.nature.com/articles/s41586-021-04301-9',
        'https://deepmind.google/discover/blog/accelerating-fusion-science-through-learned-plasma-control/',
      ],
    },
    {
      id: 'tech_passive_safety',
      label: 'Passive Safety Systems',
      type: 'EnablingTechnology',
      trl_current: '7-9 (LWRs); 4-6 (Novel Coolants)',
      references: [
        'https://www.nrc.gov/reactors/new-reactors/advanced/ap1000.html',
        'https://www.iaea.org/publications/10880/passive-safety-systems-and-natural-circulation-in-nuclear-power-plants',
      ],
    },
    {
      id: 'tech_rad_hard_electronics',
      label: 'Radiation-Hardened Electronics',
      type: 'EnablingTechnology',
      trl_current: '3-7 (Application Dependent)',
      references: [
        'https://nepp.nasa.gov/',
        'https://escies.org/space-components',
        'https://www.sandia.gov/advanced_microelectronics/',
      ],
    },
    {
      id: 'tech_plasma_heating',
      label: 'Plasma Heating Systems',
      type: 'EnablingTechnology',
      trl_current: '5-6',
      references: [
        'https://www.iter.org/mach/hcd',
        'https://www.iter.org/mach/nb',
      ],
    },
    {
      id: 'tech_divertor_concepts',
      label: 'Advanced Divertor Concepts',
      type: 'EnablingTechnology',
      trl_current: '2-3',
      references: [
        'https://www.gov.uk/government/news/mast-upgrade-helping-answer-the-big-questions-in-fusion-physics',
        'https://www.iter.org/node/20687/masts-divertor-concept-yields-positive-results',
        'https://pubs.aip.org/aip/pop/article/20/10/102507/318117/magnetic-geometry-and-physics-of-advanced',
      ],
    },
    {
      id: 'milestone_advanced_divertor_test',
      label: 'Advanced Divertor Test Facility (DTT)',
      type: 'Milestone',
      subtype: 'ComponentTest',
      trl_current: '3',
      references: [
        'https://www.iter.org/fr/node/20687/public/private-consortium-building-dtt-tokamak',
        'https://iris.enea.it/retrieve/dd11e37c-d64a-5d97-e053-d805fe0a6f04/DTT-IDR-Summary.pdf',
        'https://www.igi.cnr.it/en/research/magnetic-confinement-research-in-padova/dtt/',
      ],
    },
  ],
  edges: [
    {
      id: 'dep_lts_physics_to_iter',
      source: 'milestone_lts_physics_validation',
      target: 'milestone_iter_construction',
    },
    {
      id: 'dep_iter_to_tbm_test',
      source: 'milestone_iter_construction',
      target: 'tech_tritium_breeding',
    },
    {
      id: 'dep_iter_to_pfm_test',
      source: 'milestone_iter_construction',
      target: 'tech_pfm',
    },
    {
      id: 'dep_hts_tech_to_magnet_demo',
      source: 'tech_hts_magnets',
      target: 'milestone_hts_magnet_demo',
    },
    {
      id: 'dep_magnet_demo_to_sparc',
      source: 'milestone_hts_magnet_demo',
      target: 'milestone_sparc_net_energy',
    },
    {
      id: 'dep_w7x_to_hts_stellarator',
      source: 'milestone_w7x_optimization_proof',
      target: 'milestone_hts_stellarator_coil_fab',
    },
    {
      id: 'dep_hts_tech_to_stellarator_fab',
      source: 'tech_hts_magnets',
      target: 'milestone_hts_stellarator_coil_fab',
    },
    {
      id: 'dep_frc_sustain_to_net_energy',
      source: 'milestone_frc_stable_sustainment',
      target: 'milestone_frc_net_energy',
    },
    {
      id: 'dep_nif_ignition_to_ife_driver',
      source: 'milestone_nif_ignition',
      target: 'milestone_ife_driver_dev',
    },
    {
      id: 'dep_lwr_smr_approval_to_build',
      source: 'milestone_lwr_smr_design_approval',
      target: 'milestone_lwr_smr_first_build',
    },
    {
      id: 'dep_triso_fab_to_htgr_demo',
      source: 'tech_triso_fuel',
      target: 'milestone_htgr_demo_reactors',
    },
    {
      id: 'dep_haleu_to_advanced_fission',
      source: 'tech_haleu',
      targets: ['concept_htgr', 'concept_sfr', 'concept_msr'],
    },
    {
      id: 'dep_msre_to_msr_materials',
      source: 'milestone_msre_operation',
      target: 'milestone_msr_materials_qualification',
    },
    {
      id: 'dep_sfr_proto_to_commercial',
      source: 'milestone_sfr_prototype_operation',
      target: 'concept_sfr',
    },
    {
      id: 'dep_metallic_fuel_to_fast_reactors',
      source: 'tech_metallic_fuel',
      targets: ['concept_sfr', 'concept_twr'],
    },
    {
      id: 'dep_sco2_tech_to_demo',
      source: 'tech_power_cycle_sco2',
      target: 'milestone_step_demo_operation',
    },
    {
      id: 'dep_sco2_demo_to_reactors',
      source: 'milestone_step_demo_operation',
      targets: ['concept_htgr', 'concept_sfr', 'concept_msr', 'concept_lfr'],
    },
    {
      id: 'dep_divertor_concepts_to_dtt',
      source: 'tech_divertor_concepts',
      target: 'milestone_advanced_divertor_test',
    },
    {
      id: 'dep_dtt_to_commercial_fusion',
      source: 'milestone_advanced_divertor_test',
      targets: ['concept_hts_tokamak', 'concept_stellarator'],
    },

    {
      id: 'link_iter_to_concept',
      source: 'milestone_iter_construction',
      target: 'concept_lts_tokamak',
    },
    {
      id: 'link_sparc_to_concept',
      source: 'milestone_sparc_net_energy',
      target: 'concept_hts_tokamak',
    },
    {
      id: 'link_hts_stellarator_to_concept',
      source: 'milestone_hts_stellarator_coil_fab',
      target: 'concept_stellarator',
    },
    {
      id: 'link_frc_to_concept',
      source: 'milestone_frc_net_energy',
      target: 'concept_frc',
    },
    {
      id: 'link_icf_to_concept',
      source: 'milestone_ife_driver_dev',
      target: 'concept_icf',
    },
    {
      id: 'link_z_pinch_to_concept',
      source: 'milestone_sfs_z_pinch_stability',
      target: 'concept_z_pinch',
    },
    {
      id: 'link_smr_to_concept',
      source: 'milestone_lwr_smr_first_build',
      target: 'concept_lwr_smr',
    },
    {
      id: 'link_htgr_to_concept',
      source: 'milestone_htgr_demo_reactors',
      target: 'concept_htgr',
    },
    {
      id: 'link_msr_to_concept',
      source: 'milestone_msr_materials_qualification',
      target: 'concept_msr',
    },
    {
      id: 'link_lfr_to_concept',
      source: 'milestone_lfr_materials_qualification',
      target: 'concept_lfr',
    },
    {
      id: 'link_twr_to_concept',
      source: 'milestone_twr_fuel_qualification',
      target: 'concept_twr',
    },

    {
      id: 'dep_tritium_to_fusion',
      source: 'tech_tritium_breeding',
      targets: [
        'concept_lts_tokamak',
        'concept_hts_tokamak',
        'concept_stellarator',
      ],
    },
    {
      id: 'dep_pfm_to_fusion',
      source: 'tech_pfm',
      targets: [
        'concept_lts_tokamak',
        'concept_hts_tokamak',
        'concept_stellarator',
        'concept_frc',
      ],
    },
    {
      id: 'dep_passive_safety_to_fission',
      source: 'tech_passive_safety',
      targets: [
        'concept_lwr_smr',
        'concept_htgr',
        'concept_msr',
        'concept_sfr',
        'concept_lfr',
      ],
    },
    {
      id: 'dep_rad_hard_to_all',
      source: 'tech_rad_hard_electronics',
      targets: [
        'concept_lts_tokamak',
        'concept_hts_tokamak',
        'concept_stellarator',
        'concept_frc',
        'concept_icf',
        'concept_z_pinch',
        'concept_lwr_smr',
        'concept_htgr',
        'concept_msr',
        'concept_sfr',
        'concept_lfr',
        'concept_twr',
      ],
    },
    {
      id: 'dep_plasma_heating_to_mcf',
      source: 'tech_plasma_heating',
      targets: [
        'concept_lts_tokamak',
        'concept_hts_tokamak',
        'concept_stellarator',
        'concept_frc',
      ],
    },
    {
      id: 'dep_ai_ml_to_all',
      source: 'tech_ai_ml_control',
      targets: [
        'concept_lts_tokamak',
        'concept_hts_tokamak',
        'concept_stellarator',
        'concept_frc',
        'concept_icf',
        'concept_z_pinch',
        'concept_lwr_smr',
        'concept_htgr',
        'concept_msr',
        'concept_sfr',
        'concept_lfr',
        'concept_twr',
      ],
    },
  ],
};

export const DATA: TechTree = {
  nodes: tech_tree.nodes.map((n) => ({
    id: n.id,
    data: {
      label: n.label,
      nodeLabel: n.type as NodeLabel,
      description: n.label,
      detailedDescription:
        nodeDescriptions[n.id] ||
        `${n.label} - Detailed description pending research and development.`,
      ...Object.fromEntries(
        Object.entries(n).filter(([k]) => !['id', 'label', 'type'].includes(k)),
      ),
    },
  })),
  edges: tech_tree.edges.flatMap((e) => {
    if (e.target) {
      return [
        {
          id: e.id,
          source: e.source,
          target: e.target,
        },
      ];
    }
    if (e.targets) {
      return e.targets.map((t, idx) => ({
        id: `${e.id}_${idx}`,
        source: e.source,
        target: t,
      }));
    }
    return [];
  }),
};

// Export the original tech_tree for the scheduler
export const TECH_TREE_FOR_SCHEDULER = tech_tree;
