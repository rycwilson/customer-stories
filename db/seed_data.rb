# frozen_string_literal: true

module SeedData
  INDUSTRIES = [
    'Aerospace & Defense',
    'Agriculture',
    'Automotive',
    'Education',
    'Energy & Utilities',
    'Financial Services',
    'Government',
    'Healthcare & Life Sciences',
    'Legal',
    'Manufacturing',
    'Marketing & Advertising',
    'Media & Entertainment',
    'Non-Profit',
    'Professional Services',
    'Real Estate & Construction',
    'Retail',
    'Technology',
    'Telecommunications',
    'Transport & Logistics',
    'Travel & Hospitality',
    'Other'
  ].freeze

  CUSTOMERS = [
    { name: 'Greens Food Suppliers', logo_url: 'https://pigment.github.io/fake-logos/logos/medium/color/1.png' },
    { name: 'Autospeed', logo_url: 'https://pigment.github.io/fake-logos/logos/medium/color/2.png' },
    { name: "Croft's Accountants", logo_url: 'https://pigment.github.io/fake-logos/logos/medium/color/3.png' },
    { name: 'Cheshire Country Hygiene Services', logo_url: 'https://pigment.github.io/fake-logos/logos/medium/color/4.png' },
    { name: 'Fast Banana', logo_url: 'https://pigment.github.io/fake-logos/logos/medium/color/5.png' },
    { name: 'Yoga Baby', logo_url: 'https://pigment.github.io/fake-logos/logos/medium/color/6.png' },
    { name: 'James & Sons', logo_url: 'https://pigment.github.io/fake-logos/logos/medium/color/7.png' },
    { name: 'The Dance Studio', logo_url: 'https://pigment.github.io/fake-logos/logos/medium/color/8.png' },
    { name: 'SpaceCube Architects', logo_url: 'https://pigment.github.io/fake-logos/logos/medium/color/9.png' },
    { name: 'Beauty Box', logo_url: 'https://pigment.github.io/fake-logos/logos/medium/color/11.png' },
    { name: 'The Web Works', logo_url: 'https://pigment.github.io/fake-logos/logos/medium/color/12.png' },
    { name: "Pete's Blinds", logo_url: 'https://pigment.github.io/fake-logos/logos/medium/color/13.png' },
  ].map do |customer_data|
    customer_data.merge(
      description:
        Faker::Lorem.paragraph(sentence_count: 3, supplemental: true, random_sentences_to_add: 2)
    )
  end

  # CUSTOMERS = [
  #   { name: "Clearbyte", "industry": "Technology" },
  #   # { name: "Netwise", industry: "Technology" },
  #   { name: "Codepath", industry: "Education" },
  #   { name: "Signalform", industry: "Telecommunications" },
  #   # { name: "Fundspring", industry: "Financial Services" },
  #   { name: "Trustwell", industry: "Financial Services" },
  #   # { name: "Blueledger", industry: "Financial Services" },
  #   { name: "Yieldstone", industry: "Financial Services" },
  #   # { name: "Wellara", industry: "Healthcare & Life Sciences" },
  #   { name: "Carespire", industry: "Healthcare & Life Sciences" },
  #   # { name: "Pathwise Health", industry: "Healthcare & Life Sciences" },
  #   { name: "Purevita", industry: "Healthcare & Life Sciences" },
  #   { name: "Gridline Energy", industry: "Energy & Utilities" },
  #   # { name: "Solarveil", industry: "Energy & Utilities" },
  #   { name: "Nextwell Power", industry: "Energy & Utilities" },
  #   # { name: "Coreflow Utilities", industry: "Energy & Utilities" },
  #   { name: "Harvest & Hearth", industry: "Retail" },
  #   # { name: "Everfold", industry: "Retail" },
  #   # { name: "Goldencrate", industry: "Retail" },
  #   { name: "Kindroot", industry: "Retail" },
  #   { name: "Broadlynx", industry: "Telecommunications" },
  #   # { name: "Voicefront", industry: "Telecommunications" },
  #   { name: "Streamwise", industry: "Media & Entertainment" },
  #   { name: "Steelmark", industry: "Manufacturing" },
  #   { name: "Ironridge Systems", industry: "Manufacturing" },
  #   # { name: "Craftline Tools", industry: "Manufacturing" },
  #   { name: "Forgeway", industry: "Manufacturing" },
  #   # { name: "Skyreach Dynamics", industry: "Aerospace & Defense" },
  #   { name: "Northbeam Technologies", industry: "Aerospace & Defense" },
  #   { name: "Flightcore", industry: "Aerospace & Defense" },
  #   # { name: "Freightnest", industry: "Transport & Logistics" },
  #   { name: "Roadspire", industry: "Transport & Logistics" },
  #   # { name: "Portlane Group", industry: "Transport & Logistics" },
  #   # { name: "Earthwell Farms", industry: "Agriculture" },
  #   { name: "Greenline Resources", industry: "Agriculture" }
  # ]

  CATEGORIES = [
    { name: 'Tools & Equipment' },
    { name: 'Novelty & Entertainment' },
    { name: 'Transportation' },
    { name: 'Technology' },
    { name: 'Safety & Security' }
  ].freeze

  PRODUCTS = [
    { name: 'Anvil', category: 'Tools & Equipment' },
    { name: 'Rocket Sled', category: 'Transportation' },
    { name: 'Explosive Tennis Balls', category: 'Novelty & Entertainment' },
    { name: 'Earthquake Pills', category: 'Safety & Security' },
    { name: 'Giant Rubber Band', category: 'Tools & Equipment' },
    { name: 'Invisible Paint', category: 'Technology' },
    { name: 'Jet-Powered Roller Skates', category: 'Transportation' },
    { name: 'Trap Door Deluxe', category: 'Safety & Security' },
    { name: 'Pogo Cannon', category: 'Novelty & Entertainment' },
    { name: 'Rubber Chicken', category: 'Novelty & Entertainment' },
    { name: 'Boomerang Sawblade', category: 'Tools & Equipment' },
    { name: 'Suction Boots', category: 'Transportation' },
    { name: 'Banana Peel Dispenser', category: 'Novelty & Entertainment' },
    { name: 'Iron Carrot', category: 'Tools & Equipment' },
    { name: 'Glue Grenade', category: 'Tools & Equipment' },
    { name: 'Time-Space Gun', category: 'Technology' }
  ].freeze

  RESULTS = [
    'Increased sales by 37%',
    'Reduced response time by 45%',
    'Boosted customer engagement by 25%',
    'Elevated productivity by 60%',
    'Cut operational costs by 30%',
    'Streamlined supply chain, improving delivery times by 22%',
    'Boosted customer retention by 40%',
    'Reduced service downtime by 50%',
    'Increased employee satisfaction by 35%',
    'Improved customer satisfaction across all service channels',
    'Enhanced team collaboration and communication',
    'Strengthened brand reputation in the industry',
    'Elevated employee morale through workplace improvements',
    'Achieved 90% on-time project delivery rate',
    'Increased customer lifetime value by 15%',
    'Improved customer support ticket resolution time by 40%',
    'Increased production efficiency by 12%',
    'Increased market share by 18%',
    'Improved net promoter score (NPS) by 10 points',
    'Increased client trust and long-term partnerships'
  ].freeze

  CUSTOMER_INVITATION_TEMPLATE = {
    name: 'Customer',
    request_subject:
      '[contributor_first_name], please participate in a [customer_name] success story',
    request_body: <<~HTML.squish
      <p><span class="placeholder" contenteditable="false">[contributor_first_name]</span>,</p>
      <p>Congratulations, you have been nominated for a success story.</p>
      <p><span class="placeholder" contenteditable="false">[referrer_full_name]</span> referred me to you. I work at <span class="placeholder" contenteditable="false">[company_name]</span> and would like to write a success story about your project highlighting your results. The final story will be a great reference that professionally showcases your accomplishments at <span class="placeholder" contenteditable="false">[customer_name]</span>.</p>
      <p>Here is how it works. First, please follow the link below to provide your input to a few questions:</p>
      <p><span class="placeholder cta-wrapper submit-link" contenteditable="false">[contribution_submission_button={text:"Share Your Story",color:"#4d8664"}]</span></p>
      <p>Your answers will provide a foundation for the success story, which I will draft and send to you for review. When finished, it will be published on our Customer Stories site, and you will be able to reference it from other sites such as your LinkedIn page.</p>
      <p>I'm confident this story will benefit you. Career coaches recommend participating in success stories as an effective and natural way to advance careers.</p>
      <p>Please call or email if you have any questions.</p>
      <p>Thank you,</p>
      <p id="curator-signature">
        <img id="curator-img" src="https://d2dy20007nrj5u.cloudfront.net/assets/placeholders/user-photo-missing-93cb05229fb0f63973620d5088ead376682b0a98920e89b486501553fe5909ee.png" style="width:80px;margin-bottom:4px;" onerror="this.style.display='none'"><br>
        <span class="placeholder" contenteditable="false" style="line-height:1.4">[curator_full_name]</span><br>
        <span class="placeholder" contenteditable="false" style="line-height:1.4">[curator_title]</span><br>
        <span class="placeholder" contenteditable="false" style="line-height:1.4">[company_name]</span><br>
        <span class="placeholder" contenteditable="false" style="line-height:1.4">[curator_phone]</span>
      </p>
    HTML
  }.freeze

  CUSTOMER_SUCCESS_INVITATION_TEMPLATE = {
    name: 'Customer Success',
    request_subject: '[customer_name] and [company_name] success story',
    request_body: <<~HTML.squish
      <p><span class="placeholder" contenteditable="false">[contributor_first_name]</span>,</p>
      <p>Congratulations! Your customer <span contenteditable="false">[customer_name]</span> has been nominated for a success story.</p>
      <p>I plan to write a success story about their project highlighting the results. It will also include how you helped them in the process. The published story will be a great reference for new prospects showcasing how you contributed to the success at <span class="placeholder" contenteditable="false">[customer_name]</span></p>
      <p>Here is how it works. To start, all I need is ten minutes of your time to jot down some notes here:</p>
      <p><span class="placeholder cta-wrapper submit-link" contenteditable="false">[contribution_submission_button={text:"Share Your Input",color:"#4d8664"}]</span></p>
      <p>Once I get all the input, I will then draft the story and may call for some added information.</p>
      <p>Please call or email with any questions. I am confident you will find the final success story very valuable to both your career and winning new customers.</p>
      <p>Thank you,</p>
      <p id="curator-signature">
        <img id="curator-img" src="https://d2dy20007nrj5u.cloudfront.net/assets/placeholders/user-photo-missing-93cb05229fb0f63973620d5088ead376682b0a98920e89b486501553fe5909ee.png" style="width:80px;margin-bottom:4px;" onerror="this.style.display='none'"><br>
        <span class="placeholder" contenteditable="false" style="line-height:1.4">[curator_full_name]</span><br>
        <span class="placeholder" contenteditable="false" style="line-height:1.4">[curator_title]</span><br>
        <span class="placeholder" contenteditable="false" style="line-height:1.4">[company_name]</span><br>
        <span class="placeholder" contenteditable="false" style="line-height:1.4">[curator_phone]</span>
      </p>
    HTML
  }.freeze

  SALES_INVITATION_TEMPLATE = {
    name: 'Sales',
    request_subject: '[customer_name] win story',
    request_body: <<~HTML.squish
      <p><span class="placeholder" contenteditable="false">[contributor_first_name]</span>,</p>
      <p>Congratulations on your win at <span class="placeholder" contenteditable="false">[customer_name]</span>!</p>
      <p>I will write a win story about this sales success which will be shared within <span class="placeholder" contenteditable="false">[company_name]</span>. The story will be a great example of the great work you and your team do. It's also an opportunity to give a kudos to the folks that helped you.</p>
      <p>Here is how it works. To start, all I need is ten minutes of your time to answer some questions:</p>
      <p><span class="placeholder cta-wrapper submit-link" contenteditable="false">[contribution_submission_button={text:"Share Your Win",color:"#4d8664"}]</span></p>
      <p>Once I get your input, I will draft the win story and I may call for some added context.</p>
      <p>Please call or email with any questions. I am confident you will find the final win story valuable to you, your peers, and <span class="placeholder" contenteditable="false">[company_name]</span>.</p>
      <p>Thank you,</p>
      <p id="curator-signature">
        <img id="curator-img" src="https://d2dy20007nrj5u.cloudfront.net/assets/placeholders/user-photo-missing-93cb05229fb0f63973620d5088ead376682b0a98920e89b486501553fe5909ee.png" style="width:80px;margin-bottom:4px;" onerror="this.style.display='none'"><br>
        <span class="placeholder" contenteditable="false" style="line-height:1.4">[curator_full_name]</span><br>
        <span class="placeholder" contenteditable="false" style="line-height:1.4">[curator_title]</span><br>
        <span class="placeholder" contenteditable="false" style="line-height:1.4">[company_name]</span><br>
        <span class="placeholder" contenteditable="false" style="line-height:1.4">[curator_phone]</span>
      </p>
    HTML
  }.freeze

  CONTRIBUTOR_ROLES = ['Customer', 'Customer Success', 'Sales'].freeze

  CONTRIBUTOR_QUESTIONS = [
    { role: 'Customer', question: 'What was the challenge or disruption requiring action?' },
    { role: 'Customer', question: 'What were the hurdles to solving the challenge?' },
    { role: 'Customer', question: 'What was the journey to solving the challenge?' },
    { role: 'Customer', question: 'What were the positive outcomes for you and the company?' },
    { role: 'Customer Success', question: "What was the customer's challenge or disruption requiring action?" },
    { role: 'Customer Success', question: "What were the customer's hurdles to solving the challenge?" },
    { role: 'Customer Success', question: 'What was your joint journey to helping them solve the challenge?' },
    { role: 'Customer Success', question: 'What were the positive outcomes for the stakeholders and the company?' },
    { role: 'Sales', question: "What was the customer's challenge or disruption requiring action?" },
    { role: 'Sales', question: "What were the customer's hurdles to solving the challenge?" },
    { role: 'Sales', question: "What was your joint journey to helping them solve the challenge?" },
    { role: 'Sales', question: 'What were the positive outcomes for the stakeholders and the company?'}
  ].freeze

  VIDEO_IDS = %w[
    NAWL8ejf2nM
    fgRFQJCHcPw
    ixljWVyPby0
    PDtVP6R6C0g
    xlDXQdgx_QU
    vt0Y39eMvpI
    cDfQo1ANeLM
    _eWUgSC9ktY
    hoe24aSvLtw
    koPEnaz0Qm8
    kFEK0Sbq4o8
    zIV4poUZAQo
    0M0FfQzSngM
    GC4efF5qrCc
    SjJYNZirQCU
    9-zf2UBp7fY
    lCUBQnsS9go
  ].freeze

  def self.lorem_paragraph_html
    Array.new(2 + rand(0..2)) { Faker::Lorem.sentence(word_count: rand(15..18), supplemental: true) }
         .join(' ')
         .sub(/^/, '<p>')
         .sub(/$/, '</p><br>')
  end

  # Generates a customer win and story using the provided data
  def self.generate_success_and_story(customer)
    product = PRODUCTS.sample[:name]
    acme_product = "Acme #{product}"

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
      lambda {
        {
          success_name: "#{product} Implementation Project",
          story_title: "#{customer.name} #{verb} #{department} Operations with #{acme_product}"
        }
      },
      lambda {
        {
          success_name: "#{job_field} Optimization Using #{product}",
          story_title: "How #{customer.name} #{verb} Results in #{job_field} with #{acme_product}"
        }
      },
      lambda {
        {
          success_name: "#{job_title} Enablement via #{product}",
          story_title: "#{customer.name} #{verb} Its #{job_title.pluralize} with #{acme_product}"
        }
      },
      lambda {
        {
          success_name: "#{product} Integration in #{department}",
          story_title: "#{customer.name} #{verb} #{department} Workflows with #{acme_product}"
        }
      },
      lambda {
        {
          success_name: "#{buzzword} Initiative: #{product} Rollout",
          story_title: "#{customer.name} #{verb} Business Outcomes with Its #{buzzword} Initiative and #{acme_product}"
        }
      },
      lambda {
        {
          success_name: "Deployment of #{product} Across #{job_field}",
          story_title: "#{customer.name} #{verb} #{job_field} Performance by Scaling #{acme_product}"
        }
      },
      lambda {
        {
          success_name: "Performance Gains Through #{product} Adoption",
          story_title: "#{customer.name} #{verb} Efficiency by #{percentage}% Using #{acme_product}"
        }
      },
      lambda {
        {
          success_name: "Modernizing #{department} with #{product}",
          story_title: "#{customer.name} #{verb} #{department} Productivity by #{percentage}% with #{acme_product}"
        }
      },
      lambda {
        {
          success_name: "Revamping #{job_field} Processes with #{product}",
          story_title: "#{customer.name} #{verb} #{job_field} Throughput by #{percentage}% Thanks to #{acme_product}"
        }
      }
    ]

    formats.sample.call
  end
end
