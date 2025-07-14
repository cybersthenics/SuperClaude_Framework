#!/usr/bin/env python3
"""
Test Python file for LSP analysis
"""

import os
import sys
from typing import Dict, List, Optional


class DataProcessor:
    """A simple data processor class for testing LSP capabilities."""
    
    def __init__(self, name: str, config: Optional[Dict] = None):
        self.name = name
        self.config = config or {}
        self.processed_items: List[str] = []
    
    def process_data(self, data: List[Dict]) -> Dict[str, int]:
        """Process a list of data items and return statistics."""
        stats = {
            'total_items': len(data),
            'valid_items': 0,
            'invalid_items': 0
        }
        
        for item in data:
            if self.validate_item(item):
                stats['valid_items'] += 1
                self.processed_items.append(item.get('id', 'unknown'))
            else:
                stats['invalid_items'] += 1
        
        return stats
    
    def validate_item(self, item: Dict) -> bool:
        """Validate a single data item."""
        required_fields = ['id', 'name', 'value']
        
        for field in required_fields:
            if field not in item:
                return False
        
        # Check value is numeric
        try:
            float(item['value'])
            return True
        except (ValueError, TypeError):
            return False
    
    def get_summary(self) -> str:
        """Get a summary of processed data."""
        return f"Processor '{self.name}' has processed {len(self.processed_items)} items"


def main():
    """Main function for testing."""
    processor = DataProcessor("test_processor")
    
    test_data = [
        {'id': '1', 'name': 'item1', 'value': 10.5},
        {'id': '2', 'name': 'item2', 'value': 'invalid'},
        {'id': '3', 'name': 'item3', 'value': 25.0},
    ]
    
    results = processor.process_data(test_data)
    print(f"Processing results: {results}")
    print(processor.get_summary())


if __name__ == "__main__":
    main()