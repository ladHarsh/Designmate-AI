import React from "react";

export default function CardGrid({ title, destinations = [], cards = [], items = [], style = {}, cardStyle = {} }) {
  console.log('🔍 CardGrid - title:', title, 'destinations:', destinations, 'cards:', cards, 'items:', items);
  
  // Use items first (most common), then cards, then destinations
  const cardData = items.length > 0 ? items : (cards.length > 0 ? cards : destinations);
  
  // Ensure cardData is an array and each item has the required properties
  const safeCards = Array.isArray(cardData) ? cardData.filter(card => 
    card && typeof card === 'object' && (card.name || card.title)
  ) : [];

  return (
    <section className="rounded-lg" style={style}>
      {title && <h2 className="text-2xl font-semibold mb-4">{title}</h2>}
      <div className="grid gap-4" style={{ gridTemplateColumns: style.gridTemplateColumns || "repeat(auto-fit, minmax(300px, 1fr))" }}>
        {safeCards.length > 0 ? safeCards.map((card, idx) => {
          const cardTitle = card.name || card.title || `Card ${idx + 1}`;
          const cardImage = card.image;
          const cardDescription = card.description || '';
          const cardLink = card.link;
          const cardPrice = card.price;
          const cardRating = card.rating;
          const cardCategory = card.category;
          
          return (
            <div key={card.id || cardTitle} className="bg-white rounded-lg shadow overflow-hidden flex flex-col hover:shadow-lg transition-shadow" style={cardStyle}>
              {cardImage && (
                <img src={cardImage} alt={cardTitle} className="w-full h-40 object-cover" />
              )}
              <div className="p-4 flex-1 flex flex-col">
                {cardCategory && (
                  <span className="text-xs text-blue-600 font-medium mb-1">{cardCategory}</span>
                )}
                <h3 className="font-bold text-lg mb-2">{cardTitle}</h3>
                <p className="text-gray-600 flex-1 mb-3">{cardDescription}</p>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center space-x-2">
                    {cardPrice && (
                      <span className="text-lg font-bold text-green-600">${cardPrice}</span>
                    )}
                    {cardRating && (
                      <div className="flex items-center">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm text-gray-600 ml-1">{cardRating}</span>
                      </div>
                    )}
                  </div>
                  {cardLink && (
                    <a href={cardLink} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Learn More →
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        }) : <div className="text-gray-400">No cards available.</div>}
      </div>
    </section>
  );
} 