INDUSTRIES = %w(
  Aerospace & Defense
  Agriculture
  Automotive 
  Education 
  Energy & Utilities 
  Financial Services 
  Government 
  Healthcare & Life Sciences
  Legal
  Manufacturing 
  Marketing & Advertising
  Media & Entertainment 
  Non-Profit
  Professional Services
  Real Estate & Construction
  Retail
  Technology 
  Telecommunications
  Transport & Logistics
  Travel & Hospitality
  Other
);

CATEGORIES = [
  'Tools & Equipment',
  'Novelty & Entertainment',
  'Transportation & Mobility',
  'Science & Technology',
  'Safety & Security'
]

PRODUCTS = [
  'Anvil',
  'Rocket Sled',
  'Explosive Tennis Balls',
  'Earthquake Pills',
  'Giant Rubber Band',
  'Invisible Paint',
  'Jet-Powered Roller Skates',
  'Trap Door Deluxe',
  'Pogo Cannon',
  'Rubber Chicken',
  'Boomerang Sawblade',
  'Suction Boots',
  'Banana Peel Dispenser',
  'Iron Carrot',
  'Glue Grenade',
  'Time-Space Gun',
]

CUSTOMERS = [
  { name: "Clearbyte", industry: "Technology" },
  { name: "Netwise", industry: "Technology" },
  { name: "Codepath", industry: "Education" },
  { name: "Signalform", industry: "Telecommunications" },
  { name: "Fundspring", industry: "Financial Services" },
  { name: "Trustwell", industry: "Financial Services" },
  { name: "Blueledger", industry: "Financial Services" },
  { name: "Yieldstone", industry: "Financial Services" },
  { name: "Wellara", industry: "Healthcare & Life Sciences" },
  { name: "Carespire", industry: "Healthcare & Life Sciences" },
  { name: "Pathwise Health", industry: "Healthcare & Life Sciences" },
  { name: "Purevita", industry: "Healthcare & Life Sciences" },
  { name: "Gridline Energy", industry: "Energy & Utilities" },
  { name: "Solarveil", industry: "Energy & Utilities" },
  { name: "Nextwell Power", industry: "Energy & Utilities" },
  { name: "Coreflow Utilities", industry: "Energy & Utilities" },
  { name: "Harvest & Hearth", industry: "Retail" },
  { name: "Everfold", industry: "Retail" },
  { name: "Goldencrate", industry: "Retail" },
  { name: "Kindroot", industry: "Retail" },
  { name: "Broadlynx", industry: "Telecommunications" },
  { name: "Voicefront", industry: "Telecommunications" },
  { name: "Streamwise", industry: "Media & Entertainment" },
  { name: "Steelmark", industry: "Manufacturing" },
  { name: "Ironridge Systems", industry: "Manufacturing" },
  { name: "Craftline Tools", industry: "Manufacturing" },
  { name: "Forgeway", industry: "Manufacturing" },
  { name: "Skyreach Dynamics", industry: "Aerospace & Defense" },
  { name: "Northbeam Technologies", industry: "Aerospace & Defense" },
  { name: "Flightcore", industry: "Aerospace & Defense" },
  { name: "Freightnest", industry: "Transport & Logistics" },
  { name: "Roadspire", industry: "Transport & Logistics" },
  { name: "Portlane Group", industry: "Transport & Logistics" },
  { name: "Earthwell Farms", industry: "Agriculture" },
  { name: "Greenline Resources", industry: "Agriculture" }
]

RESULTS = [
  "Increased sales by 37%",
  "Reduced response time by 45%",
  "Boosted customer engagement by 25%",
  "Elevated productivity by 60%",
  "Cut operational costs by 30%",
  "Streamlined supply chain, improving delivery times by 22%",
  "Boosted customer retention by 40%",
  "Reduced service downtime by 50%",
  "Increased employee satisfaction by 35%",
  "Improved customer satisfaction across all service channels",
  "Enhanced team collaboration and communication",
  "Strengthened brand reputation in the industry",
  "Elevated employee morale through workplace improvements",
  "Achieved 90% on-time project delivery rate",
  "Increased customer lifetime value by 15%",
  "Improved customer support ticket resolution time by 40%",
  "Increased production efficiency by 12%",
  "Increased market share by 18%",
  "Improved net promoter score (NPS) by 10 points",
  "Increased client trust and long-term partnerships"
]

def generate_customer_win_and_story
  format_acme_product = Proc.new { |product| "Acme #{product}" }

  customer = CUSTOMERS.sample
  customer_name = customer[:name]
  product = PRODUCTS.sample
  acme_product = format_acme_product.call(product)

  buzzword = Faker::Company.buzzword.capitalize
  department = Faker::Commerce.department
  job_field = Faker::Job.field
  job_title = Faker::Job.title
  percentage = rand(25..75)
  verb = %w[
    Achieved Boosted Delivered Drove Enabled Enhanced Expanded
    Elevated Grew Improved Increased Modernized Optimized Strengthened
    Streamlined Transformed Unlocked Created Accelerated
  ].sample

  formats = [
    -> {
      {
        customer_win: "#{product} Implementation Project",
        customer_story: "#{customer_name} #{verb} #{department} Operations with #{acme_product}"
      }
    },
    -> {
      {
        customer_win: "#{job_field} Optimization Using #{product}",
        customer_story: "How #{customer_name} #{verb} Results in #{job_field} with #{acme_product}"
      }
    },
    -> {
      {
        customer_win: "#{job_title} Enablement via #{product}",
        customer_story: "#{customer_name} #{verb} Its #{job_title.pluralize} with #{acme_product}"
      }
    },
    -> {
      {
        customer_win: "#{product} Integration in #{department}",
        customer_story: "#{customer_name} #{verb} #{department} Workflows with #{acme_product}"
      }
    },
    -> {
      {
        customer_win: "#{buzzword} Initiative: #{product} Rollout",
        customer_story: "#{customer_name} #{verb} Business Outcomes with Its #{buzzword} Initiative and #{acme_product}"
      }
    },
    -> {
      {
        customer_win: "Deployment of #{product} Across #{job_field}",
        customer_story: "#{customer_name} #{verb} #{job_field} Performance by Scaling #{acme_product}"
      }
    },
    -> {
      {
        customer_win: "Performance Gains Through #{product} Adoption",
        customer_story: "#{customer_name} #{verb} Efficiency by #{percentage}% Using #{acme_product}"
      }
    },
    -> {
      {
        customer_win: "Modernizing #{department} with #{product}",
        customer_story: "#{customer_name} #{verb} #{department} Productivity by #{percentage}% with #{acme_product}"
      }
    },
    -> {
      {
        customer_win: "Revamping #{job_field} Processes with #{product}",
        customer_story: "#{customer_name} #{verb} #{job_field} Throughput by #{percentage}% Thanks to #{acme_product}"
      }
    }
  ]

  formats.sample.call
end
