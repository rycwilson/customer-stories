namespace :temp do

  desc "temp stuff"

  task adwords: :environment do
    Story.where(published: true).each do |story|
      story.create_adwords_config(long_headline: story.title)
    end
  end

  task quotes: :environment do
    Story.friendly.find('varmour-protects-community-s-information-at-john-muir-health')
         .update(quote_attr_name:'Jon Russell',
                 quote_attr_title: 'SVP/CIO at John Muir Health')
    Story.friendly.find('equens-achieves-agile-security-with-varmour-and-atos')
         .update(quote_attr_name:'Ian Saggers',
                 quote_attr_title:'Global Head, IT Infrastructure, Equens')
    Story.friendly.find('varmour-protects-student-information-at-education-networks-of-america')
         .update(quote_attr_name:'Michael McKerley',
                 quote_attr_title:'Chief Technology Officer at ENA')
    Story.friendly.find('top-fortune-100-retailer-solves-visibility-and-pci-challenges-with-varmour')
         .update(quote_attr_name:'VP of IT',
                 quote_attr_title:'Fortune 100 Retailer')
    Story.friendly.find('varmour-secures-next-gen-infrastructure-at-dubai-municipality')
         .update(quote_attr_name:'Ahmed Mohd. Kajoor',
                 quote_attr_title:'Head of IT Infrastructure')
    Story.friendly.find('choice-holdings-navigates-global-expansion-optimally')
         .update(quote_attr_name:'Denis Maia',
                 quote_attr_title:'CEO, Choice Holdings Energy Intelligence')
    Story.friendly.find('vas-accelerates-its-global-expansion')
         .update(quote_attr_name:'Manuel Soares',
                 quote_attr_title:'CEO, Valley Agriculture Software (VAS)')
    Story.friendly.find('luxcloud-goes-global')
         .update(quote_attr_name:'Marco Houwen',
                 quote_attr_title:'LuxCloud CEO (former)')
    Story.friendly.find('how-tipalti-cranked-up-a-successful-abm-program')
         .update(quote_attr_name:'Rob Israch',
                 quote_attr_title:'Chief Marketing Officer of Tipalti')
    Story.friendly.find('exit-realty-grows-listings-with-corefact')
         .update(quote_attr_name:'Kris Klair',
                 quote_attr_title:'Broker/Owner, Exit Realty Consultants')
    Story.friendly.find('coldwell-banker-gets-year-over-year-increases-in-listings-with-corefact')
         .update(quote_attr_name:'Kacie Ricker',
                 quote_attr_title:'Regional VP of Marketing, Coldwell Banker Residential Brokerage')
    Story.friendly.find('umass-lowell-department-of-biology')
         .update(quote_attr_name:'Umass Lowell Department of Biology Professor',
                 quote_attr_title:'')
    Story.friendly.find('introduction-to-biology-for-students-majoring-in-other-fields')
         .update(quote_attr_name:'Umass Lowell Student',
                 quote_attr_title:'')
    Story.friendly.find('going-digital-in-high-growth-international-markets')
         .update(quote_attr_name:'Tim Cannon',
                 quote_attr_title:'EVP, International Markets & Global Strategic Alliances, Houghton Mifflin Harcourt (HMH)')
    Story.friendly.find('integrating-concepts-in-biology')
         .update(quote_attr_name:'Dr. Douglas Luckie, Ph.D.',
                 quote_attr_title:'Associate Professor of Biology, Michigan State University')
    Story.friendly.find('a-good-business-plan-is-a-beautiful-thing')
         .update(quote_attr_name:'Dr. Joshua Hernsberger',
                 quote_attr_title:'Assistant Professor – Management, Gordon Ford College of Business')
    Story.friendly.find('value-received-a-resource-used-continuously-for-advocacy-program-best-practices')
         .update(quote_attr_name:'Ginnie Hazlett',
                 quote_attr_title:'Cisco')
    Story.friendly.find('how-to-deploy-a-customer-reference-application-for-your-sales-team')
         .update(quote_attr_name:'Scott Acheson',
                 quote_attr_title:'Director SAP Customer Central - SAP')
    Story.friendly.find('value-received-amazing-energy-and-motivation-for-our-entire-team')
         .update(quote_attr_name:'Abby Atkinson',
                 quote_attr_title:'Senior Manager, Customer Reference Program')
    Story.friendly.find('value-received-create-affordable-customer-videos')
         .update(quote_attr_name:'Rhett Livengood',
                 quote_attr_title:'Director, Digital Business Enabling, Intel')
    Story.friendly.find('value-received-broadening-customer-advocacy-experience')
         .update(quote_attr_name:'Sue Renner',
                 quote_attr_title:'Customer Marketing & References, Vocera')
    Story.friendly.find('priceless-guidance-for-building-our-program')
         .update(quote_attr_name:'Daniel Palay',
                 quote_attr_title:'Manager Global Customer Programs at Elastic')
    Story.friendly.find('finding-inspiration-and-smart-peers-at-the-summit')
         .update(quote_attr_name:'Victoria LaPlante',
                 quote_attr_title:'HubSpot User Groups (HUG) Program Manager')
    Story.friendly.find('getting-actionable-answers-at-the-summit')
         .update(quote_attr_name:'Ginnie Hazlett',
                 quote_attr_title:'Customer Advocacy Manager - OpenDNS at Cisco')
    Story.friendly.find('superior-networking-inspirational-thought-leadership')
         .update(quote_attr_name:'Chris Adlard',
                 quote_attr_title:'Senior Manager, Global Client Engagement - Misys')
    Story.friendly.find('zoom-helps-tivo-galvanize-the-dvr-industry-vernacular')
         .update(quote_attr_name:'Brodie Keast',
                 quote_attr_title:'VP and GM, Media / Services Business Unit')
    Story.friendly.find('yahoo-mail-reduced-test-time-86-and-improved-debugging-time-five-fold')
         .update(quote_attr_name:'Mohit Goenka',
                 quote_attr_title:'Senior Software Development Engineer and Product Manager')
  end

  task make_widgets: :environment do
    Company.all.each do |company|
      case company.subdomain
      when 'trunity'
        tab_color = '#FEBE57'
      when 'compas'
        tab_color = '#e55f53'
      when 'varmour'
        tab_color = '#60ccf3'
      when 'centerforcustomerengagement'
        tab_color = '#007fc5'
      when 'zeniq'
        tab_color = '#364150'
      when 'corefact'
        tab_color = '#1f9421'
      when 'saucelabs'
        tab_color = '#e2231a'
      when 'juniper'
        tab_color = '#3493c1'
      when 'neonova'
        tab_color = '#669bb2'
      when 'kodacon'
        tab_color = '#85cee6'
      when 'zoommarketing'
        tab_color = '#9e61a8'
      when 'modeanalytics'
        tab_color = '#37b067'
      when 'acme-test'
        tab_color = '#ff0000'
      else
        tab_color = 'rgb(14, 122, 254)'
      end
      company.create_widget(tab_color: tab_color, text_color:'#ffffff')
    end
  end

  task cta: :environment do

    # OutboundAction -> CallToAction
    OutboundAction.all.each do |action|
      if action.type == 'OutboundLink'
        type = 'CTALink'
      elsif action.type == 'OutboundForm'
        type = 'CTAForm'
      else
        puts "No type: #{action}"
      end
      new_cta = action.attributes.reject { |attribute| attribute == 'id' }
      new_cta['type'] = type
      CallToAction.create(new_cta)
    end

    OutboundActionsStory.all.each do |entry|
      success_id = Story.find(entry.story_id).success.id
      action = OutboundAction.find(entry.outbound_action_id)
      type = 'CTALink' if action.type == 'OutboundLink'
      type = 'CTAForm' if action.type == 'OutboundForm'
      if action.description.present?
        description = action.description
      else
        description = action.display_text
      end
      cta_id = CallToAction.where({ company_id: action.company_id,
                                    description: description,
                                    type: type }).take.id
      CtasSuccess.create({
        call_to_action_id: cta_id,
        success_id: success_id
      })
    end

    CtaButton.all.each do |button|
      CallToAction.create({
        company_primary: true,
        type: 'CTALink',
        company_id: button.company_id,
        description: button.btn_text,
        link_url: button.url,
        display_text: button.btn_text
      })
      button.company.update({
        primary_cta_background_color: button.background_color,
        primary_cta_text_color: button.color
      })
    end

  end

end
