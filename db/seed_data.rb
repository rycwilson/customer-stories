module SeedData
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

  def self.faker_logo
    "https://pigment.github.io/fake-logos/logos/medium/color/#{rand(1..13)}.png"
  end

  CUSTOMERS = [
    { name: "Clearbyte", logo_url: faker_logo, "industry": "Technology" },
    # { name: "Netwise", industry: "Technology" },
    { name: "Codepath", logo_url: faker_logo, industry: "Education" },
    { name: "Signalform", logo_url: faker_logo, industry: "Telecommunications" },
    # { name: "Fundspring", industry: "Financial Services" },
    { name: "Trustwell", logo_url: faker_logo, industry: "Financial Services" },
    # { name: "Blueledger", industry: "Financial Services" },
    { name: "Yieldstone", logo_url: faker_logo, industry: "Financial Services" },
    # { name: "Wellara", industry: "Healthcare & Life Sciences" },
    { name: "Carespire", logo_url: faker_logo, industry: "Healthcare & Life Sciences" },
    # { name: "Pathwise Health", industry: "Healthcare & Life Sciences" },
    { name: "Purevita", logo_url: faker_logo, industry: "Healthcare & Life Sciences" },
    { name: "Gridline Energy", logo_url: faker_logo, industry: "Energy & Utilities" },
    # { name: "Solarveil", industry: "Energy & Utilities" },
    { name: "Nextwell Power", logo_url: faker_logo, industry: "Energy & Utilities" },
    # { name: "Coreflow Utilities", industry: "Energy & Utilities" },
    { name: "Harvest & Hearth", logo_url: faker_logo, industry: "Retail" },
    # { name: "Everfold", industry: "Retail" },
    # { name: "Goldencrate", industry: "Retail" },
    { name: "Kindroot", logo_url: faker_logo, industry: "Retail" },
    { name: "Broadlynx", logo_url: faker_logo, industry: "Telecommunications" },
    # { name: "Voicefront", industry: "Telecommunications" },
    { name: "Streamwise", logo_url: faker_logo, industry: "Media & Entertainment" },
    { name: "Steelmark", logo_url: faker_logo, industry: "Manufacturing" },
    { name: "Ironridge Systems", logo_url: faker_logo, industry: "Manufacturing" },
    # { name: "Craftline Tools", industry: "Manufacturing" },
    { name: "Forgeway", logo_url: faker_logo, industry: "Manufacturing" },
    # { name: "Skyreach Dynamics", industry: "Aerospace & Defense" },
    { name: "Northbeam Technologies", logo_url: faker_logo, industry: "Aerospace & Defense" },
    { name: "Flightcore", logo_url: faker_logo, industry: "Aerospace & Defense" },
    # { name: "Freightnest", industry: "Transport & Logistics" },
    { name: "Roadspire", logo_url: faker_logo, industry: "Transport & Logistics" },
    # { name: "Portlane Group", industry: "Transport & Logistics" },
    # { name: "Earthwell Farms", industry: "Agriculture" },
    { name: "Greenline Resources", logo_url: faker_logo, industry: "Agriculture" }
  ]
  
  CATEGORIES = [
    { name: 'Tools & Equipment' },
    { name: 'Novelty & Entertainment' },
    { name: 'Transportation & Mobility' },
    { name: 'Science & Technology' },
    { name: 'Safety & Security' }
  ]
  
  PRODUCTS = [
    { name: 'Anvil', category: 'Tools & Equipment' },
    { name: 'Rocket Sled', category: 'Transportation & Mobility' },
    { name: 'Explosive Tennis Balls', category: 'Novelty & Entertainment' },
    { name: 'Earthquake Pills', category: 'Safety & Security' },
    { name: 'Giant Rubber Band', category: 'Tools & Equipment' },
    { name: 'Invisible Paint', category: 'Science & Technology' },
    { name: 'Jet-Powered Roller Skates', category: 'Transportation & Mobility' },
    { name: 'Trap Door Deluxe', category: 'Safety & Security' },
    { name: 'Pogo Cannon', category: 'Novelty & Entertainment' },
    { name: 'Rubber Chicken', category: 'Novelty & Entertainment' },
    { name: 'Boomerang Sawblade', category: 'Tools & Equipment' },
    { name: 'Suction Boots', category: 'Tools & Equipment' },
    { name: 'Banana Peel Dispenser', category: 'Novelty & Entertainment' },
    { name: 'Iron Carrot', category: 'Tools & Equipment' },
    { name: 'Glue Grenade', category: 'Tools & Equipment' },
    { name: 'Time-Space Gun', category: 'Science & Technology' },
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

  CUSTOMER_INVITATION_TEMPLATE = {
    name: 'Customer',
    request_subject: '[contributor_first_name], please participate in a [customer_name] success story',
    request_body: "<p style=\"margin-top:0\">[contributor_first_name],</p><p>Congratulations, you have been nominated for a success story.<br></p><p><span contenteditable=\"false\">[referrer_full_name]</span> referred me to you. I work at&nbsp;<span contenteditable=\"false\">[company_name]</span>&nbsp;and would like to write a success story about your project highlighting your results. The final story will be a great reference that professionally showcases your accomplishments at [customer_name].&nbsp;<br></p><p>Here is how it works. First, please follow the link below to provide your input to a few questions:<br></p><p><span class=\"cta-wrapper submit-link\">[contribution_submission_button={text:\"Share Your Story\",color:\"#4d8664\"}]</span><br></p><p>Your answers will provide a foundation for the success story, which I will draft and send to you for review. When finished, it will be published on our customer stories site, and you will be able to reference it from other sites such as your Linkedin page.&nbsp;<br></p><p>I'm confident this story will benefit you. Career coaches recommend participating in success stories as an effective and natural way to advance careers.</p><p>Please call or email if you have any questions. Thank you,</p><p id=\"curator-signature\"><img id=\"curator-img\" src=\"https://d2dy20007nrj5u.cloudfront.net/assets/placeholders/user-photo-missing-93cb05229fb0f63973620d5088ead376682b0a98920e89b486501553fe5909ee.png\" style=\"width:80px;margin-bottom:4px;\" onerror=\"this.style.display='none'>\"><br><span style=\"line-height:1.4\">[curator_full_name]</span><br><span style=\"line-height:1.4\">[curator_title]</span><br><span style=\"line-height:1.4\">[company_name]</span><br><span style\"line-height:1.4\">[curator_phone]</span></p>"
  }

  CUSTOMER_SUCCESS_INVITATION_TEMPLATE = {
    name: 'Customer Success',
    request_subject: "[customer_name] and [company_name] success story",
    request_body: "<p style=\"margin-top:0\"><span contenteditable=\"false\">[contributor_first_name]</span>,</p><p style=\"box-sizing: border-box; margin: 0px 0px 10px; line-height: 1.7em; color: rgb(0, 0, 0); font-family: &quot;Open Sans&quot;, &quot;Trebuchet MS&quot;, arial, sans-serif; font-size: 13px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-style: initial; text-decoration-color: initial;\">Congratulations! Your customer&nbsp;<span contenteditable=\"false\" style=\"box-sizing: border-box;\"><span style=\"box-sizing: border-box;\"><span style=\"box-sizing: border-box;\"><span style=\"box-sizing: border-box;\"><span style=\"box-sizing: border-box;\"><span style=\"box-sizing: border-box;\">[customer_name]</span></span></span></span></span></span><span style=\"box-sizing: border-box;\"><span style=\"box-sizing: border-box;\"><span style=\"box-sizing: border-box;\"><span style=\"box-sizing: border-box;\"><span style=\"box-sizing: border-box;\"><span style=\"box-sizing: border-box;\"></span></span></span></span></span></span><span>&nbsp;</span>has been nominated for a&nbsp;success story.&nbsp;&nbsp;</p><p style=\"box-sizing: border-box; margin: 0px 0px 10px; line-height: 1.7em; color: rgb(0, 0, 0); font-family: &quot;Open Sans&quot;, &quot;Trebuchet MS&quot;, arial, sans-serif; font-size: 13px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-style: initial; text-decoration-color: initial;\"></p><p style=\"box-sizing: border-box; margin: 0px 0px 10px; line-height: 1.7em; color: rgb(0, 0, 0); font-family: &quot;Open Sans&quot;, &quot;Trebuchet MS&quot;, arial, sans-serif; font-size: 13px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-style: initial; text-decoration-color: initial;\">I plan to write a success story about their project highlighting the results. It will also include how you helped them in the process. The published story will be a great reference for new prospects showcasing how you contributed to the success at&nbsp;<span contenteditable=\"false\" style=\"box-sizing: border-box;\"><span style=\"box-sizing: border-box;\"><span style=\"box-sizing: border-box;\"><span style=\"box-sizing: border-box;\"><span style=\"box-sizing: border-box;\">[customer_name]</span></span></span></span></span>. &nbsp;</p><p style=\"box-sizing: border-box; margin: 0px 0px 10px; line-height: 1.7em; color: rgb(0, 0, 0); font-family: &quot;Open Sans&quot;, &quot;Trebuchet MS&quot;, arial, sans-serif; font-size: 13px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-style: initial; text-decoration-color: initial;\">Here is how it works. To start, all I need is ten minutes of your time to jot down some notes here:</p><p style=\"box-sizing: border-box; margin: 0px 0px 10px; line-height: 1.7em; color: rgb(0, 0, 0); font-family: &quot;Open Sans&quot;, &quot;Trebuchet MS&quot;, arial, sans-serif; font-size: 13px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-style: initial; text-decoration-color: initial;\"><span class=\"cta-wrapper submit-link\">[contribution_submission_button={text:\"Share Your Input\",color:\"#4d8664\"}]</span><br></p><p style=\"box-sizing: border-box; margin: 0px 0px 10px; line-height: 1.7em; color: rgb(0, 0, 0); font-family: &quot;Open Sans&quot;, &quot;Trebuchet MS&quot;, arial, sans-serif; font-size: 13px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-style: initial; text-decoration-color: initial;\">Once I get all the input, I will then draft the story&nbsp;and may call for some added information.&nbsp;</p><p style=\"box-sizing: border-box; margin: 0px 0px 10px; line-height: 1.7em; color: rgb(0, 0, 0); font-family: &quot;Open Sans&quot;, &quot;Trebuchet MS&quot;, arial, sans-serif; font-size: 13px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-style: initial; text-decoration-color: initial;\">Please call or email with any questions. I am confident you will find the final success story very valuable to both your career and winning new customers.</p><p style=\"box-sizing: border-box; margin: 0px 0px 10px; line-height: 1.7em; color: rgb(0, 0, 0); font-family: &quot;Open Sans&quot;, &quot;Trebuchet MS&quot;, arial, sans-serif; font-size: 13px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-style: initial; text-decoration-color: initial;\">Thank you,</p><p id=\"curator-signature\"><img id=\"curator-img\" src=\"https://d2dy20007nrj5u.cloudfront.net/assets/placeholders/user-photo-missing-93cb05229fb0f63973620d5088ead376682b0a98920e89b486501553fe5909ee.png\" style=\"width:80px;margin-bottom:4px;\" onerror=\"this.style.display='none'>\"><br><span style=\"line-height:1.4\">[curator_full_name]</span><br><span style=\"line-height:1.4\">[curator_title]</span><br><span style=\"line-height:1.4\">[company_name]</span><br><span style=\"line-height:1.4\">[curator_phone]</span></p>"
  }

  SALES_INVITATION_TEMPLATE = {
    name: 'Sales',
    request_subject: '[customer_name] win story',
    request_body: "<p style=\"margin-top:0\"><span contenteditable=\"false\">[contributor_first_name]</span>,</p><p style=\"box-sizing: border-box; margin: 0px 0px 10px; line-height: 1.7em; orphans: 2; text-align: start; text-indent: 0px; widows: 2; text-decoration-style: initial; text-decoration-color: initial;\">Congratulations on your win at [customer_name]!</p><p style=\"box-sizing: border-box; margin: 0px 0px 10px; line-height: 1.7em; color: rgb(0, 0, 0); font-family: &quot;Open Sans&quot;, &quot;Trebuchet MS&quot;, arial, sans-serif; font-size: 13px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-style: initial; text-decoration-color: initial;\"></p><p>I will write a win story about this sales success which will be shared within [company_name]. The story will be a great example of the great work you and your team do. It's also an opportunity to give a kudos to the folks that helped you.</p><p>Here is how it works. To start, all I need is ten minutes of your time to answer some questions:</p><p style=\"box-sizing: border-box; margin: 0px 0px 10px; line-height: 1.7em; color: rgb(0, 0, 0); font-family: &quot;Open Sans&quot;, &quot;Trebuchet MS&quot;, arial, sans-serif; font-size: 13px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-style: initial; text-decoration-color: initial;\"><span class=\"cta-wrapper submit-link\">[contribution_submission_button={text:\"Share Your Win\",color:\"#4d8664\"}]</span><br></p><p>Once I get your input, I will draft the win story and I may call for some added context.&nbsp;</p><p>Please call or email with any questions. I am confident you will find the final win story valuable to you, your peers, and [company_name].<br></p><p style=\"box-sizing: border-box; margin: 0px 0px 10px; line-height: 1.7em; color: rgb(0, 0, 0); font-family: &quot;Open Sans&quot;, &quot;Trebuchet MS&quot;, arial, sans-serif; font-size: 13px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-style: initial; text-decoration-color: initial;\">Thank you,</p><p id=\"curator-signature\"><img id=\"curator-img\" src=\"https://d2dy20007nrj5u.cloudfront.net/assets/placeholders/user-photo-missing-93cb05229fb0f63973620d5088ead376682b0a98920e89b486501553fe5909ee.png\" style=\"width:80px;margin-bottom:4px;\" onerror=\"this.style.display='none'>\"><br><span style=\"line-height:1.4\">[curator_full_name]</span><br><span style=\"line-height:1.4\">[curator_title]</span><br><span style=\"line-height:1.4\">[company_name]</span><br><span style=\"line-height:1.4\">[curator_phone]</span></p><p style=\"box-sizing: border-box; margin: 0px 0px 10px; line-height: 1.7em; color: rgb(0, 0, 0); font-family: &quot;Open Sans&quot;, &quot;Trebuchet MS&quot;, arial, sans-serif; font-size: 13px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-style: initial; text-decoration-color: initial;\"></p>"
  }

  def self.lorem_paragraph_html
    Array.new(2 + rand(0..3)) { Faker::Lorem.sentence(word_count: rand(15..18), supplemental: true) }
      .join(' ')
      .sub(/^/, '<p>')
      .sub(/$/, '</p><br>')
  end

  # Generates a customer win and story using the provided data
  def self.generate_success_and_story
    customer = CUSTOMERS.sample
    customer_name = customer[:name]
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
      -> {
        {
          success_name: "#{product} Implementation Project",
          story_title: "#{customer_name} #{verb} #{department} Operations with #{acme_product}"
        }
      },
      -> {
        {
          success_name: "#{job_field} Optimization Using #{product}",
          story_title: "How #{customer_name} #{verb} Results in #{job_field} with #{acme_product}"
        }
      },
      -> {
        {
          success_name: "#{job_title} Enablement via #{product}",
          story_title: "#{customer_name} #{verb} Its #{job_title.pluralize} with #{acme_product}"
        }
      },
      -> {
        {
          success_name: "#{product} Integration in #{department}",
          story_title: "#{customer_name} #{verb} #{department} Workflows with #{acme_product}"
        }
      },
      -> {
        {
          success_name: "#{buzzword} Initiative: #{product} Rollout",
          story_title: "#{customer_name} #{verb} Business Outcomes with Its #{buzzword} Initiative and #{acme_product}"
        }
      },
      -> {
        {
          success_name: "Deployment of #{product} Across #{job_field}",
          story_title: "#{customer_name} #{verb} #{job_field} Performance by Scaling #{acme_product}"
        }
      },
      -> {
        {
          success_name: "Performance Gains Through #{product} Adoption",
          story_title: "#{customer_name} #{verb} Efficiency by #{percentage}% Using #{acme_product}"
        }
      },
      -> {
        {
          success_name: "Modernizing #{department} with #{product}",
          story_title: "#{customer_name} #{verb} #{department} Productivity by #{percentage}% with #{acme_product}"
        }
      },
      -> {
        {
          success_name: "Revamping #{job_field} Processes with #{product}",
          story_title: "#{customer_name} #{verb} #{job_field} Throughput by #{percentage}% Thanks to #{acme_product}"
        }
      }
    ]

    formats.sample.call
  end
end
